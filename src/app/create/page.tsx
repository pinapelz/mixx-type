"use client";
import { useState } from "react";
import { MdLibraryMusic } from "react-icons/md";
import { FaCopy, FaCheck, FaExternalLinkAlt } from "react-icons/fa";
import { Root, Navbar, Logo, LogoIcon, NavLink } from "../styles/shared";
import {
  Content,
  Heading,
  Subheading,
  Form,
  FieldGroup,
  Label,
  Input,
  Divider,
  Row,
  GenerateButton,
  OutputSection,
  OutputLabel,
  CodeBox,
  CopyButton,
  OpenLink,
} from "./page.styles";

interface TypingPayload {
  file1?: string;
  lrc?: string;
  offset?: number;
  title?: string;
  artist?: string;
  skip_backing?: boolean;
}

export default function CreatePage() {
  const [lrc, setLrc] = useState("");
  const [file1, setFile1] = useState("");
  const [offset, setOffset] = useState("");

  const [typingTitle, setTypingTitle] = useState("");
  const [typingArtist, setTypingArtist] = useState("");
  const [skipBacking, setSkipBacking] = useState(true);

  const [code, setCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const resetCopyStates = () => {
    setCopiedCode(false);
    setCopiedUrl(false);
  };

  const generate = () => {
    const payload: TypingPayload = {};
    if (file1.trim()) payload.file1 = file1.trim();
    if (lrc.trim()) payload.lrc = lrc.trim();
    if (offset.trim() !== "") payload.offset = Number(offset);
    if (typingTitle.trim()) payload.title = typingTitle.trim();
    if (typingArtist.trim()) payload.artist = typingArtist.trim();
    payload.skip_backing = skipBacking;

    setCode(btoa(JSON.stringify(payload)));
    resetCopyStates();
  };

  const copy = (text: string, which: "code" | "url") => {
    navigator.clipboard.writeText(text);
    if (which === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const shareUrl = code ? `${window.location.origin}/game?code=${code}` : "";

  return (
    <Root>
      <Navbar>
        <Logo href="/typing">
          <LogoIcon>
            <MdLibraryMusic />
          </LogoIcon>
          LRC-Type
        </Logo>
        <NavLink href="/typing">← Back</NavLink>
      </Navbar>

      <Content>
        <Heading>Create a Code</Heading>
        <Subheading>
          Generate a shareable code for your typing game session.
        </Subheading>

        <Form>
          <FieldGroup>
            <Label>Primary Media</Label>
            <Input
              type="url"
              placeholder="https://example.com/song.mp4"
              value={file1}
              onChange={(e) => setFile1(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>LRC Lyrics</Label>
            <Input
              type="url"
              placeholder="https://example.com/song.lrc"
              value={lrc}
              onChange={(e) => setLrc(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label title="Offset in milliseconds. Increase this value if the main audio is ahead of the lyrics.">
              LRC Offset (ms)
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={offset}
              onChange={(e) => setOffset(e.target.value)}
              step="25"
            />
          </FieldGroup>

          <Divider />

          <Row>
            <FieldGroup>
              <Label>Title</Label>
              <Input
                type="text"
                placeholder="Song Title"
                value={typingTitle}
                onChange={(e) => setTypingTitle(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Artist</Label>
              <Input
                type="text"
                placeholder="Artist Name"
                value={typingArtist}
                onChange={(e) => setTypingArtist(e.target.value)}
              />
            </FieldGroup>
          </Row>

          <Row>
            <FieldGroup>
              <Label title="When enabled, lyrics inside parentheses are treated as backing lyrics and skipped.">
                Skip Backing
              </Label>
              <Input
                type="checkbox"
                checked={skipBacking}
                onChange={(e) => setSkipBacking(e.target.checked)}
                style={{ width: "18px", height: "18px", marginTop: "10px" }}
              />
            </FieldGroup>
          </Row>

          <GenerateButton onClick={generate}>Generate Code</GenerateButton>
        </Form>

        {code && (
          <OutputSection>
            <div>
              <OutputLabel>Code</OutputLabel>
              <CodeBox>
                {code}
                <CopyButton
                  $copied={copiedCode}
                  onClick={() => copy(code, "code")}
                  aria-label="Copy code"
                >
                  {copiedCode ? <FaCheck /> : <FaCopy />}
                </CopyButton>
              </CodeBox>
            </div>

            <div>
              <OutputLabel>Share URL</OutputLabel>
              <CodeBox>
                {shareUrl}
                <CopyButton
                  $copied={copiedUrl}
                  onClick={() => copy(shareUrl, "url")}
                  aria-label="Copy URL"
                >
                  {copiedUrl ? <FaCheck /> : <FaCopy />}
                </CopyButton>
              </CodeBox>
            </div>

            <OpenLink href={shareUrl} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt /> Open in Typing Game
            </OpenLink>
          </OutputSection>
        )}
      </Content>
    </Root>
  );
}
