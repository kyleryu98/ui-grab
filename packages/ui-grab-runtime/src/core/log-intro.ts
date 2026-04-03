import { LOGO_SVG } from "./logo-svg.js";
import { getRuntimeEnv } from "../utils/runtime-env.js";

const REPOSITORY_URL = "https://github.com/Yongtaek-Ryu/ui-grab";

export const logIntro = () => {
  try {
    const version = getRuntimeEnv("VERSION");
    const logoDataUri = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;
    console.log(
      `%cUI Grab${version ? ` v${version}` : ""}%c\n${REPOSITORY_URL}`,
      `background: #330039; color: #ffffff; border: 1px solid #d75fcb; padding: 4px 4px 4px 24px; border-radius: 4px; background-image: url("${logoDataUri}"); background-size: 16px 16px; background-repeat: no-repeat; background-position: 4px center; display: inline-block; margin-bottom: 4px;`,
      "",
    );
    // HACK: Entire intro log is best-effort; never block initialization
  } catch {}
};
