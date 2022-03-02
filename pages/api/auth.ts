import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

type ResponseData = {
    userId: string;
    accessToken: string;
    entitlementsToken: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if (req.method !== "POST") {
        res.status(405).end("Method not allowed");
        return;
    }

    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    const { username, password } = req.body;

    let userId, accessToken, entitlementsToken = "";

    try {
        // https://github.com/techchrism/valorant-api-docs/blob/trunk/docs/Riot%20Auth/POST%20Auth%20Cookies.md
        await client.post("https://auth.riotgames.com/api/v1/authorization", {
                "client_id": "play-valorant-web-prod",
                "nonce": "1",
                "redirect_uri": "https://playvalorant.com/opt_in",
                "response_type": "token id_token",
            },
        );
    } catch (e) {
        console.error(e);
        res.status(500).end("Failed to get auth cookies");
        return;
    }

    try {
        // https://github.com/techchrism/valorant-api-docs/blob/trunk/docs/Riot%20Auth/PUT%20Auth%20Request.md
        accessToken = (await client.put("https://auth.riotgames.com/api/v1/authorization", {
            "type": "auth",
            "username": username,
            "password": password,
            "remember": true,
            "language": "en_US",
        })).data.response.parameters.uri.split("=")[1].split("&")[0];
    } catch (e) {
        console.error(e);
        res.status(406).end("Bad Credentials");
        return;
    }

    const headers = {
        "content-type": "application/json",
        "Authorization": `Bearer ${ accessToken }`,
    };

    try {
        // https://github.com/techchrism/valorant-api-docs/blob/trunk/docs/Riot%20Auth/POST%20Entitlement.md
        entitlementsToken = (await client("https://entitlements.auth.riotgames.com/api/token/v1", {
            method: "POST",
            headers,
        })).data.entitlements_token;
    } catch (e) {
        console.error(e);
        res.status(500).end("Failed to get entitlements token");
        return;
    }

    try {
        // https://github.com/techchrism/valorant-api-docs/blob/trunk/docs/Riot%20Auth/GET%20RSO_GetPlayerInfo.md
        userId = (await client("https://auth.riotgames.com/userinfo", {
            method: "GET",
            headers,
        })).data.sub;
    } catch (e) {
        console.error(e);
        res.status(500).end("Failed to get user id");
        return;
    }

    res.status(200).json({ userId, accessToken, entitlementsToken });
}
