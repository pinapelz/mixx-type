"use client";

import {
  StartOverlay,
  StartCard,
  SongTitleText,
  SongArtistText,
  StartBtn,
  OpacityControl,
  OpacityLabel,
  OpacitySlider,
  OpacityValue,
  PreviewWrap,
  PreviewBtn,
  PreviewHint,
} from "../page.styles";

interface PreGameViewProps {
  isReady: boolean;
  loadingLrc: boolean;
  songTitle: string;
  songArtist: string;
  audioUrl: string;
  isVideo: boolean;
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (v: number) => void;
  isPreviewPlaying: boolean;
  onStart: () => void;
  onPreviewToggle: () => void;
}

export default function PreGameView({
  isReady,
  loadingLrc,
  songTitle,
  songArtist,
  audioUrl,
  isVideo,
  audioVolume,
  setAudioVolume,
  backgroundOpacity,
  setBackgroundOpacity,
  isPreviewPlaying,
  onStart,
  onPreviewToggle,
}: PreGameViewProps) {
  return (
    <StartOverlay>
      <StartCard>
        {!isReady ? (
          <>
            <SongTitleText>Loading...</SongTitleText>
            <SongArtistText>Please wait while we load the chart</SongArtistText>
          </>
        ) : (
          <>
            <SongTitleText>{loadingLrc ? "Loading..." : songTitle}</SongTitleText>
            <SongArtistText>{songArtist}</SongArtistText>
          </>
        )}

        <StartBtn onClick={onStart} disabled={!isReady} suppressHydrationWarning>
          {loadingLrc ? "Loading song..." : "▶  Start Game"}
        </StartBtn>

        <OpacityControl>
          <OpacityLabel>
            Volume
            <OpacityValue>{audioVolume}%</OpacityValue>
          </OpacityLabel>
          <OpacitySlider
            type="range"
            min="0"
            max="100"
            value={audioVolume}
            onChange={(e) => setAudioVolume(Number(e.target.value))}
          />
        </OpacityControl>

        {isVideo && (
          <OpacityControl>
            <OpacityLabel>
              Background opacity
              <OpacityValue>{backgroundOpacity}%</OpacityValue>
            </OpacityLabel>
            <OpacitySlider
              type="range"
              min="0"
              max="100"
              value={backgroundOpacity}
              onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
            />
          </OpacityControl>
        )}

        <PreviewWrap>
          <PreviewBtn onClick={onPreviewToggle} disabled={!audioUrl} suppressHydrationWarning>
            {isPreviewPlaying ? "⏸ Pause Preview" : "▶ Preview Audio"}
          </PreviewBtn>
          <PreviewHint>
            {audioUrl
              ? "Use preview to test your volume before starting."
              : "Load a chart to enable audio preview."}
          </PreviewHint>
        </PreviewWrap>
      </StartCard>
    </StartOverlay>
  );
}
