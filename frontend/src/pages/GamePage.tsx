import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room || !participantId) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room, participantId]);

  useEffect(() => {
    if (!room || room.status !== "playing") {
      return;
    }

    const intervalId = setInterval(() => {
      roomStore.fetchRoom().catch(() => {
        // Silently retry on next poll
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [roomStore, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.drawerId === participantId;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="drawer-banner" style={{ textAlign: "center", padding: "12px", backgroundColor: "#e0e7ff", borderRadius: "8px", marginBottom: "16px" }}>
        {isDrawer ? (
          <strong>You are the drawer</strong>
        ) : (
          <strong>{drawer?.name ?? "Someone"} is drawing</strong>
        )}
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              {isDrawer ? (
                <>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{room.currentWord}</span>
                  <span style={{ color: "#6b7280" }}>Draw this word!</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "4px" }}>
                    {room.currentWord?.split("").map(() => "_").join(" ") ?? "_ _ _ _ _"}
                  </span>
                  <span style={{ color: "#6b7280" }}>Guess the word!</span>
                </>
              )}
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
