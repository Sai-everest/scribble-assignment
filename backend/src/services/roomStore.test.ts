import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRooms,
  createRoom,
  getRoom,
  joinRoom,
  removeParticipant,
  startGame,
  toRoomSnapshot,
  GameError
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    clearRooms();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects playing rooms", () => {
    const { room, participantId } = createRoom("Alice");
    createRoom("Charlie"); // ensure another room exists for join
    const secondPlayer = joinRoom(room.code, "Bob")!;
    startGame(room.code, participantId);

    const result = joinRoom(room.code, "Carol");
    expect(result).toBeNull();
  });

  it("toRoomSnapshot includes hostId", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room);

    expect(snapshot.hostId).toBe(participantId);
  });

  it("removeParticipant transfers host to next-joined participant (FIFO)", () => {
    const { room: aliceRoom, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(aliceRoom.code, "Bob")!;
    joinRoom(aliceRoom.code, "Carol");

    removeParticipant(aliceRoom.code, aliceId);
    const updatedRoom = getRoom(aliceRoom.code)!;

    expect(updatedRoom.hostParticipantId).toBe(bobResult.participantId);
  });

  it("removeParticipant deletes room when last participant leaves", () => {
    const { room } = createRoom("Alice");

    removeParticipant(room.code, room.participants[0].id);
    const deletedRoom = getRoom(room.code);

    expect(deletedRoom).toBeNull();
  });

  it("startGame changes room status to playing", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updatedRoom = startGame(room.code, participantId);

    expect(updatedRoom.status).toBe("playing");
  });

  it("startGame throws FORBIDDEN for non-host", () => {
    const { room } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;

    expect(() => startGame(room.code, bobResult.participantId)).toThrow(GameError);
    expect(() => startGame(room.code, bobResult.participantId)).toThrow("Only the host can start the game");
  });

  it("startGame throws CONFLICT when fewer than 2 players", () => {
    const { room, participantId } = createRoom("Alice");

    expect(() => startGame(room.code, participantId)).toThrow(GameError);
    expect(() => startGame(room.code, participantId)).toThrow("At least 2 players are required");
  });

  it("startGame throws CONFLICT when room is already playing", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, participantId);

    expect(() => startGame(room.code, participantId)).toThrow(GameError);
    expect(() => startGame(room.code, participantId)).toThrow("Game already started");
  });

  it("startGame throws NOT_FOUND for unknown room", () => {
    expect(() => startGame("ZZZZ", "some-id")).toThrow(GameError);
    expect(() => startGame("ZZZZ", "some-id")).toThrow("Unable to load room");
  });

  it("createRoom throws for empty or whitespace-only name", () => {
    expect(() => createRoom("")).toThrow("Player name is required");
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("joinRoom throws for empty or whitespace-only name", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "")).toThrow("Player name is required");
    expect(() => joinRoom(room.code, "   ")).toThrow("Player name is required");
  });
});
