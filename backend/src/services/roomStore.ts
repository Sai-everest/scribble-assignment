import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function validateName(name?: string): string {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length === 0) {
    throw new Error("Player name is required");
  }
  return trimmed;
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: validateName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status === "playing") {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT"
  ) {
    super(message);
  }
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new GameError("Unable to load room", "NOT_FOUND");
  }

  if (room.hostParticipantId !== participantId) {
    throw new GameError("Only the host can start the game", "FORBIDDEN");
  }

  if (room.status !== "lobby") {
    throw new GameError("Game already started", "CONFLICT");
  }

  if (room.participants.length < 2) {
    throw new GameError("At least 2 players are required", "CONFLICT");
  }

  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function removeParticipant(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return null;
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(code);
    return null;
  }

  if (room.hostParticipantId === participantId) {
    const nextHost = room.participants[0];
    room.hostParticipantId = nextHost.id;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export function cleanupIdleRooms() {
  const cutoff = new Date(Date.now() - IDLE_TIMEOUT_MS).toISOString();

  for (const [code, room] of rooms.entries()) {
    if (room.status === "lobby" && room.updatedAt < cutoff) {
      rooms.delete(code);
    }
  }
}

export function clearRooms() {
  rooms.clear();
}

// Start periodic cleanup
setInterval(cleanupIdleRooms, 60_000);

export function toRoomSnapshot(room: Room, _viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostParticipantId,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
