import { courseTheme } from "../lib/learning";
export function CourseArtwork({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const theme = courseTheme(name);
  return (
    <div
      className={`course-art ${theme} ${large ? "large" : ""}`}
      aria-hidden="true"
    >
      <span className="art-caption">
        {theme === "clay"
          ? "NEURAL NETWORKS"
          : theme === "sand"
            ? "IDEAS INTO IMPACT"
            : "PATTERNS & POSSIBILITIES"}
      </span>
      <svg viewBox="0 0 320 150" fill="none">
        {theme === "clay" ? (
          <g>
            {[35, 75, 115].flatMap((y) =>
              [20, 55, 90, 125].map((z) => (
                <path
                  key={`${y}-${z}`}
                  d={`M75 ${y} L160 ${z} L245 ${y}`}
                  stroke="currentColor"
                  opacity=".2"
                />
              )),
            )}
            {[75, 160, 245].map((x, i) =>
              (i === 1 ? [20, 55, 90, 125] : [35, 75, 115]).map((y) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="8"
                  fill="var(--art-bg)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              )),
            )}
          </g>
        ) : theme === "sand" ? (
          <g stroke="currentColor" strokeWidth="1.5">
            <rect
              x="82"
              y="28"
              width="105"
              height="96"
              rx="4"
              transform="rotate(-9 82 28)"
              opacity=".3"
            />
            <rect
              x="123"
              y="23"
              width="105"
              height="104"
              rx="4"
              fill="var(--art-bg)"
            />
            <path d="M142 49h43m-43 13h66m-66 36 17-15 17 7 29-20" />
            <circle cx="205" cy="70" r="3" fill="currentColor" />
          </g>
        ) : (
          <g stroke="currentColor">
            <path d="M55 120V20M55 120h218" opacity=".35" />
            <path
              d="M65 110C120 109 148 72 183 55S230 45 270 21"
              strokeWidth="2"
            />
            {[
              [78, 99],
              [91, 109],
              [112, 85],
              [130, 94],
              [145, 65],
              [173, 70],
              [184, 44],
              [216, 52],
              [237, 24],
              [252, 39],
            ].map(([x, y]) => (
              <circle
                key={x}
                cx={x}
                cy={y}
                r="4"
                fill="currentColor"
                stroke="none"
                opacity=".65"
              />
            ))}
            <path
              d="M55 75h218M55 30h218M110 20v100M165 20v100M220 20v100"
              opacity=".07"
            />
          </g>
        )}
      </svg>
      <span className="art-index">
        {theme === "clay"
          ? "02 / DL"
          : theme === "sand"
            ? "03 / PM"
            : name
                .split(/\s+/)
                .slice(0, 3)
                .map((word) => word[0])
                .join("")
                .toUpperCase()}
      </span>
    </div>
  );
}
