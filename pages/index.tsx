import type { NextPage } from "next";
import { useState } from "react";
import axios from "axios";

const region = "na";

const Home: NextPage = () => {
        const [username, setUsername] = useState<string>("");
        const [password, setPassword] = useState<string>("");

        const [accessToken, setAccessToken] = useState<string>("");
        const [entitlementsToken, setEntitlementsToken] = useState<string>("");
        const [userId, setUserId] = useState<string>("");

        const [authState, setAuthState] = useState<"missing" | "loading" | "success" | "error">("missing");

        const [shop, setShop] = useState<string[]>([]);

        const auth = async () => {
            setAuthState("loading");

            const response = await axios("/api/auth", {
                    method: "POST",
                    data: {
                        username,
                        password,
                    },
                },
            );

            if (response.status !== 200) {
                console.log(response);
                setAuthState("error");
                return;
            }

            setAccessToken(response.data.accessToken);
            setEntitlementsToken(response.data.entitlementsToken);
            setUserId(response.data.userId);


            setAuthState("success");

            console.log(response.data);
        };

        const getShop = async () => {
            setShop((await axios.get(`/api/shop?region=${ region }&userId=${ userId }&accessToken=${ accessToken }&entitlementsToken=${ entitlementsToken }`)).data.skins);
        };

        return (
            <div>
                <input type="text" value={ username } onChange={ (e) => setUsername(e.target.value) }/>
                <input type="password" value={ password } onChange={ (e) => setPassword(e.target.value) }/>
                <button onClick={ auth }>Submit</button>

                <br/>
                <button onClick={ getShop }>Get Shop</button>

                <pre>{ authState }</pre>

                <br/>

                <h1>Your Shop</h1>
                <ul>
                    { shop.map((item) => <li key={ item }>{ item }</li>) }
                </ul>

            </div>
        );
    }
;

export default Home;
