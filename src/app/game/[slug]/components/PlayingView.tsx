"use client";

import { FaRedo } from "react-icons/fa";
import {
  HUD,
  HudStat,
  HudValue,
  HudLabel,
  ComboValue,
  GameArea,
  UpcomingWrap,
  UpcomingLabel,
  UpcomingText,
  CurrentWrap,
  LineTimingRow,
  LineTimingMeta,
  LineTimingValue,
  LineTimingBar,
  LineTimingFill,
  CharRow,
  WordWrap,
  CharBox,
  ClearToast,
  GetReadyText,
  CompletedLineFade,
  GameFooter,
  ControlBtn,
  ProgressWrap,
  ProgressFill,
  TimeText,
  StartOverlay,
  StartCard,
  SongTitleText,
  CountdownNumber,
} from "../page.styles";
import { formatTime, calculateCPSNeeded, GameLine } from "../game.utils";
import { GState } from "../game.stat";

type GamePhase = "idle" | "countdown" | "playing" | "paused" | "finished";

interface PlayingViewProps {
  phase: GamePhase;
  countdown: number;
  g: GState;
  accuracy: number;
  wpm: number;
  gameLines: GameLine[];
  currentMs: number;
  duration: number;
  progressPct: number;
  lineTimingPct: number;
  lineRemainingMs: number;
  currentLineTime: number;
  intermissionData: { pct: number; remainingMs: number };
  endingIntermissionData: { canSkip: boolean; remainingMs: number };
  wrongChar: boolean;
  clearShowing: boolean;
  comboAnimKey: number;
  wrapSpaceIndicators: boolean[];
  charRowRef: React.MutableRefObject<HTMLDivElement | null>;
  charRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
  onRestart: () => void;
}

export default function PlayingView({
  phase,
  countdown,
  g,
  accuracy,
  wpm,
  gameLines,
  currentMs,
  duration,
  progressPct,
  lineTimingPct,
  lineRemainingMs,
  currentLineTime,
  intermissionData,
  endingIntermissionData,
  wrongChar,
  clearShowing,
  comboAnimKey,
  wrapSpaceIndicators,
  charRowRef,
  charRefs,
  onRestart,
}: PlayingViewProps) {
  return (
    <>
      {phase === "countdown" && (
        <StartOverlay>
          <StartCard>
            <SongTitleText>Get Ready</SongTitleText>
            <CountdownNumber>{countdown}</CountdownNumber>
          </StartCard>
        </StartOverlay>
      )}

      <HUD>
        <HudStat>
          <HudValue>{g.score.toLocaleString()}</HudValue>
          <HudLabel>Score</HudLabel>
        </HudStat>
        <HudStat>
          <ComboValue $animate={comboAnimKey > 0} key={`combo-${comboAnimKey}`}>
            x{g.combo}
          </ComboValue>
          <HudLabel>Combo</HudLabel>
        </HudStat>
        <HudStat>
          <HudValue>{accuracy}%</HudValue>
          <HudLabel>Accuracy</HudLabel>
        </HudStat>
        <HudStat>
          <HudValue>{wpm}</HudValue>
          <HudLabel>WPM</HudLabel>
        </HudStat>
        <HudStat>
          <HudValue>{g.totalMiss}</HudValue>
          <HudLabel>Misses</HudLabel>
        </HudStat>
      </HUD>

      <GameArea>
        {phase === "playing" && g.displayedLineIdx < 0 && gameLines.length > 0 && (
          <>
            <UpcomingWrap>
              <UpcomingLabel>Next</UpcomingLabel>
              <UpcomingText>
                {gameLines[0] && gameLines[0].content.trim() === ""
                  ? "[INTERMISSION]"
                  : (gameLines[0]?.content ?? "")}
              </UpcomingText>
            </UpcomingWrap>
            <CurrentWrap style={{ position: "relative" }}>
              <LineTimingRow>
                <LineTimingMeta>
                  Time to first line:{" "}
                  <LineTimingValue>
                    {Math.max(0, intermissionData.remainingMs / 1000).toFixed(1)}s
                  </LineTimingValue>
                </LineTimingMeta>
              </LineTimingRow>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, textAlign: "center" }}>
                {intermissionData.remainingMs > 5000 && "Press Space to skip long intermissions"}
              </div>
              <LineTimingBar>
                <LineTimingFill $pct={intermissionData.pct} />
              </LineTimingBar>
              <CharRow ref={charRowRef} />
              <CompletedLineFade>[INTERMISSION]</CompletedLineFade>
            </CurrentWrap>
          </>
        )}

        {g.displayedLineIdx >= 0 && gameLines[g.displayedLineIdx] && (
          <>
            <UpcomingWrap>
              <UpcomingLabel>Next</UpcomingLabel>
              <UpcomingText>
                {gameLines[g.displayedLineIdx + 1] &&
                gameLines[g.displayedLineIdx + 1].content.trim() === ""
                  ? "[INTERMISSION]"
                  : (gameLines[g.displayedLineIdx + 1]?.content ?? "")}
              </UpcomingText>
            </UpcomingWrap>
            <CurrentWrap style={{ position: "relative" }}>
              <LineTimingRow>
                <LineTimingMeta>
                  Time left:{" "}
                  <LineTimingValue>
                    {Math.max(0, lineRemainingMs / 1000).toFixed(1)}s
                  </LineTimingValue>
                </LineTimingMeta>
                {gameLines[g.displayedLineIdx].content.trim() !== "" && (
                  <LineTimingMeta>
                    Estimated CPS:{" "}
                    <LineTimingValue>
                      {calculateCPSNeeded(gameLines[g.displayedLineIdx].content, currentLineTime / 1000).toFixed(1)}
                    </LineTimingValue>
                  </LineTimingMeta>
                )}
              </LineTimingRow>
              {endingIntermissionData.canSkip && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, textAlign: "center" }}>
                  Press Space to skip long intermissions
                </div>
              )}
              <LineTimingBar>
                <LineTimingFill $pct={lineTimingPct} />
              </LineTimingBar>
              <CharRow ref={charRowRef}>
                {gameLines[g.displayedLineIdx].content.trim() !== "" &&
                  (() => {
                    const rawText = gameLines[g.displayedLineIdx].content;
                    const text = rawText.toLowerCase();
                    const tokens = text.split(/(\s+)/).filter(Boolean);
                    let renderIndex = 0;
                    return tokens.flatMap((token, tokenIdx) => {
                      if (/^\s+$/.test(token)) {
                        return token.split("").map((ch, spaceIdx) => {
                          let state: "typed" | "active" | "pending" | "wrong";
                          if (renderIndex < g.typedCount) state = "typed";
                          else if (renderIndex === g.typedCount) state = wrongChar ? "wrong" : "active";
                          else state = "pending";
                          const charIndex = renderIndex;
                          const showIndicator = ch === " " && wrapSpaceIndicators[charIndex] && state !== "typed";
                          const displayChar = ch === " " ? (showIndicator ? "␣" : "\u00A0") : ch;
                          const element = (
                            <CharBox
                              key={`space-${tokenIdx}-${spaceIdx}`}
                              $state={state}
                              ref={(el) => { charRefs.current[charIndex] = el; }}
                            >
                              {displayChar}
                            </CharBox>
                          );
                          renderIndex += 1;
                          return element;
                        });
                      }
                      const wordChars = token.split("").map((ch, charIdx) => {
                        let state: "typed" | "active" | "pending" | "wrong";
                        if (renderIndex < g.typedCount) state = "typed";
                        else if (renderIndex === g.typedCount) state = wrongChar ? "wrong" : "active";
                        else state = "pending";
                        const charIndex = renderIndex;
                        const element = (
                          <CharBox
                            key={`char-${tokenIdx}-${charIdx}`}
                            $state={state}
                            ref={(el) => { charRefs.current[charIndex] = el; }}
                          >
                            {ch}
                          </CharBox>
                        );
                        renderIndex += 1;
                        return element;
                      });
                      return <WordWrap key={`word-${tokenIdx}`}>{wordChars}</WordWrap>;
                    });
                  })()}
              </CharRow>
              {clearShowing && <ClearToast>CLEAR!</ClearToast>}
              <CompletedLineFade>
                {gameLines[g.displayedLineIdx].content.trim() === ""
                  ? "[INTERMISSION]"
                  : g.lineCompleted
                  ? "Cleared - waiting for next line..."
                  : gameLines[g.displayedLineIdx].content}
              </CompletedLineFade>
            </CurrentWrap>
          </>
        )}

        {phase === "idle" && (
          <GetReadyText style={{ opacity: 0.3 }}>Start the game to begin typing</GetReadyText>
        )}
      </GameArea>

      <GameFooter>
        <ControlBtn onClick={onRestart} title="Restart">
          <FaRedo />
        </ControlBtn>
        <ProgressWrap>
          <ProgressFill $pct={progressPct} />
        </ProgressWrap>
        <TimeText>
          {formatTime(Math.max(0, currentMs))} / {formatTime(duration)}
        </TimeText>
      </GameFooter>
    </>
  );
}
