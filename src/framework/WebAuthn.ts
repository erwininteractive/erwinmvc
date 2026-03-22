import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import type { Request, Response } from "express";
import base64url from "base64url";

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const RP_NAME = process.env.WEBAUTHN_RP_NAME || "ErwinMVC";

function getOrigin(req: Request): string {
  const protocol = req.protocol;
  const host = req.get("host") || "localhost";
  return `${protocol}://${host}`;
}

function bufferToBase64URL(buffer: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return base64url.encode(buf);
}

function base64URLToBuffer(str: string): Uint8Array {
  return new Uint8Array(base64url.toBuffer(str));
}

export async function startRegistration(
  req: Request,
  res: Response
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { username, displayName } = req.body;

  if (!username || !displayName) {
    res.status(400).json({ error: "Username and display name are required" });
    throw new Error("Validation failed");
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: username,
    userDisplayName: displayName,
    timeout: 60000,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  (req.session as any).webauthnRegistration = {
    username,
    challenge: options.challenge,
  };

  return options;
}

export async function completeRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const prisma = getPrismaClient();

  const { username, challenge } = (req.session as any).webauthnRegistration || {};

  if (!username || !challenge) {
    res.status(400).json({ error: "Registration session expired" });
    return;
  }

  const credential = req.body;

  if (!credential || !credential.id) {
    res.status(400).json({ error: "Invalid credential data" });
    return;
  }

  let verified: VerifiedRegistrationResponse;

  try {
    verified = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: RP_ID,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Verification failed" });
    return;
  }

  const { verified: isVerified, registrationInfo } = verified;

  if (!isVerified || !registrationInfo) {
    res.status(400).json({ error: "Registration verification failed" });
    return;
  }

  const cred = registrationInfo.credential;
  const { id: credentialID, publicKey: credentialPublicKey, counter } = cred;

  try {
    await prisma.user.create({
      data: {
        username,
        email: `${username}@${RP_ID}`,
        hashedPassword: "",
        webauthnCredentials: {
          create: {
            credentialID: credentialID,
            credentialPublicKey: bufferToBase64URL(credentialPublicKey),
            counter: counter.toString(),
            transports: JSON.stringify(credential.transports || []),
          },
        },
      },
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to save credential" });
    return;
  }

  delete (req.session as any).webauthnRegistration;

  res.json({ success: true });
}

export async function startAuthentication(
  req: Request,
  res: Response
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const prisma = getPrismaClient();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      webauthnCredentials: {
        select: {
          id: true,
          credentialID: true,
          counter: true,
          transports: true,
        },
      },
    },
  });

  const allowCredentials = users
    .map((user: any) => {
      return user.webauthnCredentials.map((cred: any) => ({
        id: cred.credentialID,
        transports: JSON.parse(cred.transports || "[]"),
      }));
    })
    .flat();

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    timeout: 60000,
    userVerification: "preferred",
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
  });

  (req.session as any).webauthnAuthentication = {
    challenge: options.challenge,
  };

  return options;
}

export async function completeAuthentication(
  req: Request,
  res: Response
): Promise<void> {
  const prisma = getPrismaClient();

  const { challenge } = (req.session as any).webauthnAuthentication || {};

  if (!challenge) {
    res.status(400).json({ error: "Authentication session expired" });
    return;
  }

  const credential = req.body;

  if (!credential || !credential.id) {
    res.status(400).json({ error: "Invalid credential data" });
    return;
  }

  const credentialID = credential.id;

  const user = await prisma.user.findFirst({
    where: {
      webauthnCredentials: {
        some: {
          credentialID,
        },
      },
    },
    select: {
      id: true,
      username: true,
      webauthnCredentials: {
        where: {
          credentialID,
        },
        select: {
          id: true,
          credentialID: true,
          credentialPublicKey: true,
          counter: true,
        },
      },
    },
  });

  if (!user || user.webauthnCredentials.length === 0) {
    res.status(401).json({ error: "Credential not found" });
    return;
  }

  const webauthnCred = user.webauthnCredentials[0];

  const credentialData: any = {
    id: webauthnCred.credentialID,
    publicKey: base64URLToBuffer(webauthnCred.credentialPublicKey),
    counter: parseInt(webauthnCred.counter, 10),
  };

  let verified: VerifiedAuthenticationResponse;

  try {
    verified = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: RP_ID,
      credential: credentialData,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Verification failed" });
    return;
  }

  const { verified: isVerified, authenticationInfo } = verified;

  if (!isVerified) {
    res.status(401).json({ error: "Authentication verification failed" });
    return;
  }

  await prisma.webAuthnCredential.update({
    where: { id: webauthnCred.id },
    data: {
      counter: authenticationInfo.newCounter.toString(),
    },
  });

  (req.session as any).userId = user.id;
  (req.session as any).username = user.username;

  delete (req.session as any).webauthnAuthentication;

  res.json({ success: true, username: user.username });
}

let _prisma: any = null;
let _PrismaClient: any = null;

function getPrismaClient(): any {
  if (!_prisma) {
    if (!_PrismaClient) {
      try {
        _PrismaClient = require("@prisma/client").PrismaClient;
      } catch {
        throw new Error(
          "Prisma is not installed. Run 'npm install @prisma/client prisma' to use database features."
        );
      }
    }
    _prisma = new _PrismaClient();
  }
  return _prisma;
}

export function getRPConfig(): { rpID: string; rpName: string } {
  return {
    rpID: RP_ID,
    rpName: RP_NAME,
  };
}
