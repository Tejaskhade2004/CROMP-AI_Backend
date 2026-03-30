const extractJson = (text) => {
    if (!text) return null;

    // 1. Clean markdown code blocks
    let cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    // 2. Find JSON boundaries
    const start = cleaned.search(/[\[{]/);
    const end = Math.max(
        cleaned.lastIndexOf('}'),
        cleaned.lastIndexOf(']')
    );

    if (start === -1 || end === -1) return null;

    cleaned = cleaned.slice(start, end + 1);

    // 3. Fix trailing commas
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    // 4. Fix smart quotes
    cleaned = cleaned.replace(/\u201C|\u201D/g, '"');

    // Attempt 1: Direct JSON.parse
    try {
        return JSON.parse(cleaned);
    } catch (e1) {
        // continue to fallbacks
    }

    // Attempt 2: Fix invalid escape sequences (\d, \s, \w, etc.) and retry
    try {
        const fixed = cleaned.replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
        return JSON.parse(fixed);
    } catch (e2) {
        // continue to fallback
    }

    // Attempt 3: Manually extract HTML from within the JSON text
    //   This handles cases where JSON.parse fails but the HTML is still there
    try {
        const htmlStart = cleaned.search(/<(!doctype|html)/i);
        const htmlEnd = cleaned.toLowerCase().lastIndexOf('</html>');

        if (htmlStart !== -1 && htmlEnd !== -1) {
            let html = cleaned.slice(htmlStart, htmlEnd + '</html>'.length);

            // Unescape common JSON string escapes so the HTML is valid
            html = html
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');

            // Try to extract the "message" field
            const msgMatch = cleaned.match(/"message"\s*:\s*"([^"]*)"/);

            return {
                message: msgMatch ? msgMatch[1] : "Website generated successfully",
                code: html
            };
        }
    } catch (e3) {
        console.error("HTML extraction fallback failed:", e3);
    }

    console.error("extractJson: all parsing attempts failed");
    return null;
};

export default extractJson;