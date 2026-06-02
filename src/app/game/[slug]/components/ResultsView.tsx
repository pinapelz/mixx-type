"use client";

import { useRouter } from "next/navigation";
import {
  ResultsOverlay,
  ResultsCard,
  ResultsTitle,
  BigScore,
  StatsGrid,
  StatBlock,
  StatValue,
  StatLabel,
  ActionRow,
  PlayAgainBtn,
  HomeBtn,
} from "../page.styles";
import { GState } from "../game.stat";

interface ResultsViewProps {
  g: GState;
  accuracy: number;
  wpm: number;
  songTitle: string;
  onPlayAgain: () => void;
}

export default function ResultsView({
  g,
  accuracy,
  wpm,
  songTitle,
  onPlayAgain,
}: ResultsViewProps) {
  const router = useRouter();

  return (
    <ResultsOverlay>
      <ResultsCard>
        <ResultsTitle>Results — {songTitle}</ResultsTitle>
        <BigScore>{g.score.toLocaleString()}</BigScore>
        <StatsGrid>
          <StatBlock>
            <StatValue>{accuracy}%</StatValue>
            <StatLabel>Accuracy</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue>x{g.maxCombo}</StatValue>
            <StatLabel>Max Combo</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue>{wpm}</StatValue>
            <StatLabel>WPM</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue>{g.totalMiss}</StatValue>
            <StatLabel>Missed Chars</StatLabel>
          </StatBlock>
        </StatsGrid>
        <ActionRow>
          <PlayAgainBtn onClick={onPlayAgain}>Play Again</PlayAgainBtn>
          <HomeBtn onClick={() => router.push("/")}>Home</HomeBtn>
        </ActionRow>
      </ResultsCard>
    </ResultsOverlay>
  );
}
