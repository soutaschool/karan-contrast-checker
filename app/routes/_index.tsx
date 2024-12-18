import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useState } from "react";

const namedColors: Record<string, string> = {
	red: "#ff0000",
	blue: "#0000ff",
	green: "#008000",
	black: "#000000",
	white: "#ffffff",
	gray: "#808080",
	silver: "#c0c0c0",
	lime: "#00ff00",
	navy: "#000080",
	maroon: "#800000",
	purple: "#800080",
	olive: "#808000",
	teal: "#008080",
	aqua: "#00ffff",
	yellow: "#ffff00",
	fuchsia: "#ff00ff",
	orange: "#ffa500",
	// if need, can add more ...
};

function normalizeColor(input: string): string {
	let val = input.trim().toLowerCase();

	if (namedColors[val]) {
		return namedColors[val];
	}

	if (!val.startsWith("#")) {
		val = `#${val.replace(/^#/, "")}`;
	}

	if (!/^#[0-9a-f]{6}$/.test(val)) {
		throw new Error("Invalid color");
	}
	return val;
}

function toLinear(value: number): number {
	const v = value / 255;
	return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	const R = toLinear(r);
	const G = toLinear(g);
	const B = toLinear(b);
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(fgHex: string, bgHex: string): number {
	const fgLum = relativeLuminance(fgHex);
	const bgLum = relativeLuminance(bgHex);
	const L1 = Math.max(fgLum, bgLum);
	const L2 = Math.min(fgLum, bgLum);
	return (L1 + 0.05) / (L2 + 0.05);
}

function complianceLevel(ratio: number): "AAA" | "AA" | "Fail" {
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	return "Fail";
}

function complianceLevelLarge(ratio: number): "AAA" | "AA" | "Fail" {
	if (ratio >= 4.5) return "AAA";
	if (ratio >= 3) return "AA";
	return "Fail";
}

type ActionData =
	| {
			contrastRatio: number;
			levelSmall: "AAA" | "AA" | "Fail";
			levelLarge: "AAA" | "AA" | "Fail";
			fg: string;
			bg: string;
	  }
	| {
			error: string;
	  };

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const fgInput = formData.get("fg")?.toString() || "";
	const bgInput = formData.get("bg")?.toString() || "";

	try {
		const fg = normalizeColor(fgInput);
		const bg = normalizeColor(bgInput);
		const ratio = contrastRatio(fg, bg);
		return json<ActionData>({
			contrastRatio: ratio,
			levelSmall: complianceLevel(ratio),
			levelLarge: complianceLevelLarge(ratio),
			fg,
			bg,
		});
	} catch (err) {
		return json({ error: "Invalid input." }, { status: 400 });
	}
};

const resources = {
	ja: {
		title: "コントラストチェッカー",
		instruction:
			"名前付きCSSカラー（例：「red」「blue」）または「#」から始まる16進コード（例：「#ffffff」）を入力してください。両方のフィールドが有効なカラーである必要があります。右側にライブプレビューが表示されます。",
		fgLabel: "前景色",
		bgLabel: "背景色",
		fgPlaceholder: "#ffffff または red",
		bgPlaceholder: "#000000 または blue",
		fgDesc: "有効な色名または「#」で始まる16進コードを入力してください。",
		bgDesc: "有効な色名または「#」で始まる16進コードを入力してください。",
		checkBtn: "コントラストを確認",
		resetBtn: "リセット",
		errorPrefix: "エラー: ",
		livePreviewTitle: "ライブプレビュー",
		contrastRatio: "コントラスト比",
		wcagNormal: "通常テキストでのWCAGレベル",
		wcagLarge: "大きなテキストでのWCAGレベル",
		wcagNormalInfo: "(AA ≥4.5, AAA ≥7.0)",
		wcagLargeInfo: "(AA ≥3.0, AAA ≥4.5)",
		previewNormal: "プレビュー（通常テキスト）:",
		previewLarge: "プレビュー（大きなテキスト）:",
		sampleText: "The quick brown fox jumps over the lazy dog.",
		submittedResult: "送信結果",
		toggleLang: "Englishに切り替え",
		invalidInput: "無効な入力です。",
	},
	en: {
		title: "Contrast Checker",
		instruction: `Enter a named CSS color (e.g., "red", "blue") or a hex code starting with "#", such as "#ffffff". Both fields must be valid colors. The live preview is shown on the right.`,
		fgLabel: "Foreground Color",
		bgLabel: "Background Color",
		fgPlaceholder: "#ffffff or red",
		bgPlaceholder: "#000000 or blue",
		fgDesc: "Enter a valid color name or a hex code starting with '#'.",
		bgDesc: "Enter a valid color name or a hex code starting with '#'.",
		checkBtn: "Check Contrast",
		resetBtn: "Reset",
		errorPrefix: "Error: ",
		livePreviewTitle: "Live Preview",
		contrastRatio: "Contrast Ratio",
		wcagNormal: "WCAG Level for Normal Text",
		wcagLarge: "WCAG Level for Large Text",
		wcagNormalInfo: "(AA ≥4.5, AAA ≥7.0)",
		wcagLargeInfo: "(AA ≥3.0, AAA ≥4.5)",
		previewNormal: "Preview (Normal Text):",
		previewLarge: "Preview (Large Text):",
		sampleText: "The quick brown fox jumps over the lazy dog.",
		submittedResult: "Submitted Result",
		toggleLang: "Switch to Japanese",
		invalidInput: "Invalid input.",
	},
};

export default function Index() {
	const data = useActionData<ActionData>();

	const [lang, setLang] = useState<"ja" | "en">("ja");
	const t = resources[lang];

	const [fgInput, setFgInput] = useState(
		data && "fg" in data ? data.fg : "#ffffff",
	);
	const [bgInput, setBgInput] = useState(
		data && "bg" in data ? data.bg : "#000000",
	);

	const [fgIsValid, setFgIsValid] = useState(true);
	const [bgIsValid, setBgIsValid] = useState(true);

	let fgNormalized = "#ffffff";
	let bgNormalized = "#000000";
	let ratio = 21; // default white on black
	let levelSmall: "AAA" | "AA" | "Fail" = "AAA";
	let levelLarge: "AAA" | "AA" | "Fail" = "AAA";

	try {
		fgNormalized = normalizeColor(fgInput);
		bgNormalized = normalizeColor(bgInput);
		ratio = contrastRatio(fgNormalized, bgNormalized);
		levelSmall = complianceLevel(ratio);
		levelLarge = complianceLevelLarge(ratio);
	} catch (e) {
		console.error(e);
	}

	useEffect(() => {
		try {
			normalizeColor(fgInput);
			setFgIsValid(true);
		} catch {
			setFgIsValid(false);
		}

		try {
			normalizeColor(bgInput);
			setBgIsValid(true);
		} catch {
			setBgIsValid(false);
		}
	}, [fgInput, bgInput]);

	function resetColors() {
		setFgInput("#ffffff");
		setBgInput("#000000");
	}

	function toggleLanguage() {
		setLang((prev) => (prev === "ja" ? "en" : "ja"));
	}

	return (
		<div className="max-w-5xl mx-auto p-5 font-sans text-base leading-relaxed">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">{t.title}</h1>
				<button
					onClick={toggleLanguage}
					className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
					type="button"
				>
					{t.toggleLang}
				</button>
			</div>
			<p className="mb-6">{t.instruction}</p>

			<div className="flex flex-wrap items-start gap-8">
				<div className="flex-1 min-w-[300px]">
					<Form
						method="post"
						aria-label="Contrast checker form"
						className="mb-8"
					>
						<div className="mb-6">
							<label htmlFor="fg" className="block mb-2 font-bold">
								{t.fgLabel}
							</label>
							<div className="flex items-center gap-2">
								<div
									aria-hidden="true"
									className={`w-8 h-8 rounded ${
										fgIsValid
											? "border-2 border-gray-300"
											: "border-2 border-red-500"
									}`}
									style={{
										backgroundColor: fgIsValid ? fgNormalized : "transparent",
									}}
								/>
								<input
									id="fg"
									name="fg"
									type="text"
									value={fgInput}
									onChange={(e) => setFgInput(e.target.value)}
									className={`p-2 text-base w-48 rounded border-2 ${
										fgIsValid ? "border-gray-300" : "border-red-500"
									}`}
									aria-describedby="fg-desc"
									placeholder={t.fgPlaceholder}
								/>
							</div>
							<div id="fg-desc" className="text-sm text-gray-600 mt-2">
								{t.fgDesc}
							</div>
						</div>

						<div className="mb-6">
							<label htmlFor="bg" className="block mb-2 font-bold">
								{t.bgLabel}
							</label>
							<div className="flex items-center gap-2">
								<div
									aria-hidden="true"
									className={`w-8 h-8 rounded ${
										bgIsValid
											? "border-2 border-gray-300"
											: "border-2 border-red-500"
									}`}
									style={{
										backgroundColor: bgIsValid ? bgNormalized : "transparent",
									}}
								/>
								<input
									id="bg"
									name="bg"
									type="text"
									value={bgInput}
									onChange={(e) => setBgInput(e.target.value)}
									className={`p-2 text-base w-48 rounded border-2 ${
										bgIsValid ? "border-gray-300" : "border-red-500"
									}`}
									aria-describedby="bg-desc"
									placeholder={t.bgPlaceholder}
								/>
							</div>
							<div id="bg-desc" className="text-sm text-gray-600 mt-2">
								{t.bgDesc}
							</div>
						</div>

						<div className="flex gap-4 mt-6">
							<button
								type="submit"
								className={`px-4 py-2 text-white rounded ${
									fgIsValid && bgIsValid
										? "bg-gray-800 hover:bg-gray-700"
										: "bg-gray-400 cursor-not-allowed"
								}`}
								disabled={!fgIsValid || !bgIsValid}
							>
								{t.checkBtn}
							</button>
							<button
								type="button"
								onClick={resetColors}
								className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
							>
								{t.resetBtn}
							</button>
						</div>
					</Form>

					{data && "error" in data && (
						<div className="text-red-600 font-bold mt-4">
							{t.errorPrefix}
							{lang === "ja" ? t.invalidInput : "Invalid input."}
						</div>
					)}

					{data && "contrastRatio" in data && (
						<div className="mt-8">
							<h2 className="text-xl font-bold mb-4">{t.submittedResult}</h2>
							<p>
								<strong>{t.contrastRatio}:</strong>{" "}
								{data.contrastRatio.toFixed(2)}
							</p>
							<p>
								<strong>{t.wcagNormal}:</strong> {data.levelSmall}
							</p>
							<p>
								<strong>{t.wcagLarge}:</strong> {data.levelLarge}
							</p>
							<div
								className="mt-4 p-4 rounded text-lg"
								style={{ backgroundColor: data.bg, color: data.fg }}
							>
								Final Submission Preview: {t.sampleText}
							</div>
						</div>
					)}
				</div>

				<div className="flex-1 min-w-[300px]">
					<h2 className="text-xl font-bold mb-4">{t.livePreviewTitle}</h2>
					{fgIsValid && bgIsValid ? (
						<>
							<p>
								<strong>{t.contrastRatio}:</strong> {ratio.toFixed(2)}
							</p>
							<p>
								<strong>{t.wcagNormal}:</strong> {levelSmall}
								<br />
								<small>{t.wcagNormalInfo}</small>
							</p>
							<p>
								<strong>{t.wcagLarge}:</strong> {levelLarge}
								<br />
								<small>{t.wcagLargeInfo}</small>
							</p>
							<div
								className="mt-4 p-4 rounded text-lg"
								style={{ backgroundColor: bgNormalized, color: fgNormalized }}
								aria-label="Color preview normal text"
							>
								{t.previewNormal} {t.sampleText}
							</div>
							<div
								className="mt-4 p-4 rounded font-bold text-xl"
								style={{ backgroundColor: bgNormalized, color: fgNormalized }}
								aria-label="Color preview large text"
							>
								{t.previewLarge} {t.sampleText}
							</div>
						</>
					) : (
						<div className="text-red-600 font-bold">
							{lang === "ja"
								? "有効な色を入力するとプレビューが表示されます。"
								: "Enter valid colors to see the preview."}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
