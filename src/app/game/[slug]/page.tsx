"use client";
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { MdLibraryMusic } from "react-icons/md";
import { GameGlobalStyle, GameRoot, GameNavbar, GameContent, BackgroundVideo } from "./page.styles";
import { useGameEngine } from "./hooks/useGameEngine";
import PreGameView from "./components/PreGameView";
import PlayingView from "./components/PlayingView";
import ResultsView from "./components/ResultsView";

function GameInner() {
  const engine = useGameEngine();

  const {
    // refs
    audioRef, videoRef, charRowRef, charRefs,
    // song
    audioUrl, songTitle, songArtist, isVideo, isReady, loadingLrc,
    // phase
    phase, countdown,
    // game state
    g, gameLines, accuracy, wpm,
    // timing
    currentMs, duration, progressPct, lineTimingPct, lineRemainingMs,
    currentLineTime, intermissionData, endingIntermissionData,
    // display
    wrongChar, clearShowing, comboAnimKey, wrapSpaceIndicators,
    // settings
    backgroundOpacity, setBackgroundOpacity, audioVolume, setAudioVolume,
    isPreviewPlaying,
    // handlers
    handleStart, handleRestart, handlePreviewToggle,
  } = engine;

  return (
    <GameRoot>
      <ToastContainer theme="dark" />

      {!isVideo && (
        <audio ref={audioRef} src={audioUrl || undefined} preload="auto" />
      )}
      {isVideo && (
        <BackgroundVideo
          ref={videoRef}
          src={audioUrl || undefined}
          preload="auto"
          playsInline
          style={{ opacity: backgroundOpacity / 100 }}
        />
      )}

      <GameNavbar style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              textDecoration: "none", color: "#ffffff", fontWeight: 700, fontSize: 15,
            }}
          >
            <MdLibraryMusic style={{ fontSize: 20, color: "#a78bfa" }} />
            TypingMIXX
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
            Home
          </Link>
        </div>
      </GameNavbar>

      <GameContent style={{ position: "relative" }}>
        {phase === "idle" && (
          <PreGameView
            isReady={isReady}
            loadingLrc={loadingLrc}
            songTitle={songTitle}
            songArtist={songArtist}
            audioUrl={audioUrl}
            isVideo={isVideo}
            audioVolume={audioVolume}
            setAudioVolume={setAudioVolume}
            backgroundOpacity={backgroundOpacity}
            setBackgroundOpacity={setBackgroundOpacity}
            isPreviewPlaying={isPreviewPlaying}
            onStart={handleStart}
            onPreviewToggle={handlePreviewToggle}
          />
        )}

        {(phase === "countdown" || phase === "playing") && (
          <PlayingView
            phase={phase}
            countdown={countdown}
            g={g}
            accuracy={accuracy}
            wpm={wpm}
            gameLines={gameLines}
            currentMs={currentMs}
            duration={duration}
            progressPct={progressPct}
            lineTimingPct={lineTimingPct}
            lineRemainingMs={lineRemainingMs}
            currentLineTime={currentLineTime}
            intermissionData={intermissionData}
            endingIntermissionData={endingIntermissionData}
            wrongChar={wrongChar}
            clearShowing={clearShowing}
            comboAnimKey={comboAnimKey}
            wrapSpaceIndicators={wrapSpaceIndicators}
            charRowRef={charRowRef}
            charRefs={charRefs}
            onRestart={handleRestart}
          />
        )}

        {phase === "finished" && (
          <ResultsView
            g={g}
            accuracy={accuracy}
            wpm={wpm}
            songTitle={songTitle}
            onPlayAgain={handleRestart}
          />
        )}
      </GameContent>
    </GameRoot>
  );
}

export default function GamePage() {
  return (
    <>
      <GameGlobalStyle />
      <Suspense
        fallback={
          <GameRoot>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "rgba(255,255,255,0.5)" }}>
              Loading...
            </div>
          </GameRoot>
        }
      >
        <GameInner />
      </Suspense>
    </>
  );
}
