import React, { createContext, useContext, useState, useEffect } from "react";

export const spotifyAuthScaffold = {
    access_token: "",
    token_type: "",
    expires_in: "",
    refresh_token: "",
    scope: ""
}

export const SpotifyAuthContext = createContext(spotifyAuthScaffold);

export function useSpotifyAuthContext(){
    return useContext(SpotifyAuthContext);
}

const clientId = "7eacfdfe5b634b0786cb9b888a756c82"

export function SpotifyAuthProvider({children}){
    
    // Code required for Spotify sign in process, not usable in API requests
    let [userAuthCode, setUserAuthCode] = useState("");

    // USer access tokens and refresh tokens. Represents the current user signed in. Used in API requests.
    let [userAuthData, setUserAuthData] = useState(spotifyAuthScaffold);

	// When the page loads, check if we received a Spotify sign in result 
	useEffect(() => {
		// Attempt to find any query params from our current page URL
		const params = new URLSearchParams(window.location.search);
		// Retrieve the auth code from the query params 
		const code = params.get("code");

		setUserAuthCode(code);

		// Empty dependency array means that this useEffect only runs on page load
		// and never again


	}, []);

	useEffect(() => {

		async function getAuthData(){
			const authData = await getAuthTokens(clientId, userAuthCode);
			setUserAuthData(authData);
            // This cleans up the URL in the browser tab
            // removing the Spotify auth data so it doesn't impact the page load useEffect
			window.history.replaceState(null, "Spotify Statsboards", "/");
		}
		if (userAuthCode){
			getAuthData();
		}

		// When userAuthCode changes or initialises, we'll try and run this useEffect
	}, [userAuthCode]);

    async function getAuthTokens(clientId, code){
        const verifier = localStorage.getItem("verifier");

        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("redirect_uri", "http://localhost:5173/spotifycallback");
        params.append("code_verifier", verifier);

        // https://api.spotify.com/auth?client_id={clientId}&code={code}

        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const authTokens = await result.json();
        return authTokens;
    }



    // This function is called when the user clicks the sign in button and sends them to the Spotify sign in page
    async function redirectToAuthCodeFlow() {

        // Generate a random string for the code verifier and challenge
        const verifier = generateCodeVerifier(128);
        const challenge = await generateCodeChallenge(verifier);
        
        // Save the verifier in local storage so we can use it later
        localStorage.setItem("verifier", verifier);
    
        // Create the query parameters for the Spotify auth API
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("response_type", "code");
        params.append("redirect_uri", "http://localhost:5173/spotifycallback");
        params.append("scope", "user-read-private user-read-email");
        params.append("code_challenge_method", "S256");
        params.append("code_challenge", challenge);
    
        document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
    }
    
    // This function generates a random string for the code verifier
    function generateCodeVerifier(length) {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    
    // This function generates a code challenge from the code verifier
    async function generateCodeChallenge(codeVerifier) {
        const data = new TextEncoder().encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }




    

    return (
        <SpotifyAuthContext.Provider value={{userAuthData, redirectToAuthCodeFlow }}>
            {children}
        </SpotifyAuthContext.Provider>
    )
}