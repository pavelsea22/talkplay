import { classifyAudioError } from "../src/client/activity/audio";

describe("classifyAudioError", () => {
  it("classifies a NotAllowedError DOMException as 'autoplay'", () => {
    const err = new DOMException("autoplay blocked", "NotAllowedError");
    expect(classifyAudioError(err)).toBe("autoplay");
  });

  it("classifies an HTMLMediaElement playback error as 'playback'", () => {
    const err = new Error("Audio playback failed");
    expect(classifyAudioError(err)).toBe("playback");
  });

  it("classifies a /speak network failure (plain Error) as 'playback'", () => {
    const err = new Error("TTS request failed: 500");
    expect(classifyAudioError(err)).toBe("playback");
  });

  it("classifies a non-NotAllowed DOMException (e.g. NotSupportedError) as 'playback'", () => {
    const err = new DOMException("codec missing", "NotSupportedError");
    expect(classifyAudioError(err)).toBe("playback");
  });

  it("classifies null as 'playback' rather than throwing", () => {
    expect(classifyAudioError(null)).toBe("playback");
  });

  it("classifies undefined as 'playback' rather than throwing", () => {
    expect(classifyAudioError(undefined)).toBe("playback");
  });

  it("classifies a non-Error value as 'playback'", () => {
    expect(classifyAudioError("just a string")).toBe("playback");
  });

  it("matches by name even on plain objects (not just DOMException instances)", () => {
    expect(classifyAudioError({ name: "NotAllowedError" })).toBe("autoplay");
  });
});
