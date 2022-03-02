import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type ResponseData = any

const CLIENT_PLATFORM: string = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    if (!(req.query.accessToken && req.query.entitlementsToken)) {
        res.status(400).end("Missing access or entitlements token");
        return;
    }

    let offers: string[] = [];

    const { region, userId, accessToken, entitlementsToken } = req.query;

    try {
        // https://github.com/techchrism/valorant-api-docs/blob/trunk/docs/Store/GET%20Store_GetStorefrontV2.md
        offers = (await axios.get(`https://pd.${ region }.a.pvp.net/store/v2/storefront/${ userId }`, {
            headers: {
                "Authorization": `Bearer ${ accessToken }`,
                "X-Riot-Entitlements-JWT": entitlementsToken as string,
            },
        })).data.SkinsPanelLayout.SingleItemOffers;
    } catch (e) {
        console.error(e);
        res.status(500).end("Failed to fetch offers");
        return;
    }

    // https://dash.valorant-api.com/endpoints/version
    const clientVersion = (await axios.get("https://valorant-api.com/v1/version")).data.data.version;
    console.log(clientVersion);

    // Get all content
    const skins = (await axios.get("https://api.henrikdev.xyz/valorant/v1/content?locale=en-US")).data.skinLevels.reduce((acc: any, skin: any) => {
        return {
            ...acc,
            [skin.id.toLowerCase()]: skin.name,
        };
    });

    res.status(200).json({ skins: offers.map((offer) => skins[offer]) });
}
