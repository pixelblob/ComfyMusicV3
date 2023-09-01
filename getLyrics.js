const axios = require("axios");
const fs = require("fs").promises

async function getLyrics(trackId) {

    var tokenStorage
    try {
        tokenStorage = require("./tokenStorage.json")
    } catch (error) {
        console.log("NO TOKEN FILE GENERATING FIRST TIME!")
        await fs.writeFile("./tokenStorage.json", "{}")
        tokenStorage = {}
    }

    if (tokenStorage.accessTokenExpirationTimestampMs < new Date().getTime() || !tokenStorage.accessTokenExpirationTimestampMs) {
        console.log("GENERATING NEW TOKEN!")
        var token = (await axios.get('https://open.spotify.com/get_access_token',
            {
                headers: {
                    'Cookie': 'sp_dc=AQCks6_gCpMsw5vKk9-_felSwZB-b12hS4yeVVw4pc0AWTedIMHgJI-MYeldRmuPZgcbFHY8oexxD1asTMGjI2dWsyWH8DLdCrBLsGtIimejlmahMA7JiPFhb7Ku1GC8wzVlBYxzbw7bkRWy4UmB5-QKyrCKnC8; sp_key=560e06a6-6c6b-41e1-b6b0-ccd56986a982; sp_t=2ba783d031fbf2ed6ccee8067201dad8'
                }
            }
        )).data
        tokenStorage = token
        fs.writeFile("./tokenStorage.json", JSON.stringify(tokenStorage, null, 4))
    } else {
        console.log("USING OLD TOKEN!")
    }


    var token = tokenStorage.accessToken

    let req = await axios.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}/image/https%3A%2F%2Fi.scdn.co%2Fimage%2Fab67616d0000b273707653b29f3c4fa966d5ae3b`, {
        params: {
            'format': 'json',
            'vocalRemoval': 'false',
            'market': 'from_token'
        },
        headers: {
            'sec-ch-ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
            'DNT': '1',
            'accept-language': 'en',
            'sec-ch-ua-mobile': '?0',
            'app-platform': 'WebPlayer',
            'authorization': 'Bearer '+token,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
            'accept': 'application/json',
            //'client-token': 'AABP0YU8fKVxVI7HEtVDZ8uCb+dGd4Pdbr8LfWhv5Wq4qNg91sI/Au5nTJpJY2JwfBklYxbg09ec33jIUpbuech3kWWFl5z/lLsxm11SEKbgytaC77CypDRS55MjpyvERTI4NzC9Wuxl+dPjxUP66tXTeU8frt3v+OxUyZvWVFMwQ2sU6iySxzsOuNMhxO8NQ+rILwSMqIt4o8Yki9t1Wzrug4+q8Cps452FYEm3pXraQmXL1hBxPl9UoDwIt88aa28N3xqHuFD3zDDykxDeJ2xvIsXaKC+CGHR6VCwDrEfKEA==',
            'Referer': 'https://open.spotify.com/',
            'spotify-app-version': '1.2.14.99.g319790be',
            'sec-ch-ua-platform': '"Windows"'
        }
    });

    //console.log(req.data.lyrics.lines)
return req.data


}
module.exports = {getLyrics}