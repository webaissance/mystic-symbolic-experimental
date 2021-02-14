import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Point, BBox } from "../vendor/bezier-js";
import { dilateBoundingBox, getBoundingBoxSize } from "./bounding-box";
import { FILL_REPLACEMENT_COLOR, STROKE_REPLACEMENT_COLOR } from "./colors";
import * as colors from "./colors";
import { Specs } from "./specs";

import _SvgVocabulary from "./svg-vocabulary.json";
import type { SvgSymbolData, SvgSymbolElement } from "./vocabulary";

const APP_ID = "app";

const appEl = document.getElementById(APP_ID);

const SvgVocabulary: SvgSymbolData[] = _SvgVocabulary as any;

if (!appEl) {
  throw new Error(`Unable to find #${APP_ID}!`);
}

type SvgSymbolContext = {
  stroke: string;
  fill: string;
  showSpecs: boolean;
};

type SvgSymbolProps = {
  data: SvgSymbolData;
  scale?: number;
} & SvgSymbolContext;

const px = (value: number) => `${value}px`;

function getColor(
  ctx: SvgSymbolContext,
  color: string | undefined
): string | undefined {
  switch (color) {
    case STROKE_REPLACEMENT_COLOR:
      return ctx.stroke;
    case FILL_REPLACEMENT_COLOR:
      return ctx.fill;
  }
  return color;
}

function reactifySvgSymbolElement(
  ctx: SvgSymbolContext,
  el: SvgSymbolElement,
  key: number
): JSX.Element {
  let { fill, stroke } = el.props;
  fill = getColor(ctx, fill);
  stroke = getColor(ctx, stroke);
  return React.createElement(
    el.tagName,
    {
      ...el.props,
      id: undefined,
      fill,
      stroke,
      key,
    },
    el.children.map(reactifySvgSymbolElement.bind(null, ctx))
  );
}

const ATTACHMENT_POINT_RADIUS = 20;

const AttachmentPoints: React.FC<{ color: string; points: Point[] }> = (
  props
) => (
  <>
    {props.points.map((p, i) => (
      <circle
        key={i}
        fill={props.color}
        r={ATTACHMENT_POINT_RADIUS}
        cx={p.x}
        cy={p.y}
      />
    ))}
  </>
);

const BoundingBoxes: React.FC<{ fill: string; bboxes: BBox[] }> = (props) => (
  <>
    {props.bboxes.map((b, i) => {
      const [width, height] = getBoundingBoxSize(b);
      return (
        <rect
          key={i}
          x={b.x.min}
          y={b.y.min}
          width={width}
          height={height}
          fill={props.fill}
        />
      );
    })}
  </>
);

const SvgSymbolSpecs: React.FC<{ specs: Specs }> = ({ specs }) => {
  return (
    <>
      {specs.tail && (
        <AttachmentPoints
          color={colors.TAIL_ATTACHMENT_COLOR}
          points={specs.tail}
        />
      )}
      {specs.leg && (
        <AttachmentPoints
          color={colors.LEG_ATTACHMENT_COLOR}
          points={specs.leg}
        />
      )}
      {specs.arm && (
        <AttachmentPoints
          color={colors.ARM_ATTACHMENT_COLOR}
          points={specs.arm}
        />
      )}
      {specs.horn && (
        <AttachmentPoints
          color={colors.HORN_ATTACHMENT_COLOR}
          points={specs.horn}
        />
      )}
      {specs.crown && (
        <AttachmentPoints
          color={colors.CROWN_ATTACHMENT_COLOR}
          points={specs.crown}
        />
      )}
      {specs.nesting && (
        <BoundingBoxes
          fill={colors.NESTING_BOUNDING_BOX_COLOR}
          bboxes={specs.nesting}
        />
      )}
    </>
  );
};

const BBOX_DILATION = 50;

const SvgSymbol: React.FC<SvgSymbolProps> = (props) => {
  const d = props.data;
  const bbox = dilateBoundingBox(d.bbox, BBOX_DILATION);
  const scale = props.scale || 1;
  const [width, height] = getBoundingBoxSize(bbox);

  return (
    <svg
      viewBox={`${bbox.x.min} ${bbox.y.min} ${width} ${height}`}
      width={px(width * scale)}
      height={px(height * scale)}
    >
      {props.data.layers.map(reactifySvgSymbolElement.bind(null, props))}
      {props.showSpecs && d.specs && <SvgSymbolSpecs specs={d.specs} />}
    </svg>
  );
};

const App: React.FC<{}> = () => {
  const [stroke, setStroke] = useState("#000000");
  const [fill, setFill] = useState("#ffffff");
  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <>
      <h1>Mystic Symbolic Vocabulary</h1>
      <p>
        <label htmlFor="stroke">Stroke: </label>
        <input
          type="color"
          value={stroke}
          onChange={(e) => setStroke(e.target.value)}
          id="stroke"
        />{" "}
        <label htmlFor="fill">Fill: </label>
        <input
          type="color"
          value={fill}
          onChange={(e) => setFill(e.target.value)}
          id="fill"
        />{" "}
        <label>
          <input
            type="checkbox"
            checked={showSpecs}
            onChange={(e) => setShowSpecs(e.target.checked)}
          />{" "}
          Show specs
        </label>
      </p>
      {SvgVocabulary.map((symbolData) => (
        <div
          key={symbolData.name}
          style={{
            display: "inline-block",
            border: "1px solid black",
            margin: "4px",
          }}
        >
          <div
            style={{
              backgroundColor: "black",
              color: "white",
              padding: "4px",
            }}
          >
            {symbolData.name}
          </div>
          <div className="checkerboard-bg" style={{ lineHeight: 0 }}>
            <SvgSymbol
              data={symbolData}
              scale={0.25}
              stroke={stroke}
              fill={fill}
              showSpecs={showSpecs}
            />
          </div>
        </div>
      ))}
    </>
  );
};

ReactDOM.render(<App />, appEl);
