import { Request, Response } from "express";
import config from "../config/configSetup";
import { errorResponse, successResponse } from "../utils/modules";

/**
 * Generate short-lived Cloudflare TURN credentials for WebRTC calls.
 * Returns iceServers array ready to pass to RTCPeerConnection.
 */
export const getTurnCredentials = async (_req: Request, res: Response) => {
    try {
        if (!config.CLOUDFLARE_TURN_TOKEN_ID || !config.CLOUDFLARE_TURN_API_TOKEN) {
            return errorResponse(res, "TURN server not configured");
        }

        const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${config.CLOUDFLARE_TURN_TOKEN_ID}/credentials/generate-ice-servers`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.CLOUDFLARE_TURN_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ttl: 86400 }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Cloudflare TURN error:", response.status, text);
            return res.status(502).json({ status: false, message: "Failed to generate TURN credentials", data: text });
        }

        const data = await response.json();
        return successResponse(res, "TURN credentials generated", data);
    } catch (error) {
        console.error("getTurnCredentials error:", error);
        return errorResponse(res, "Failed to generate TURN credentials", error);
    }
};
