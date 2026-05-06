const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA3OGM2NGRiLTk0MjAtNDMyMi1hMzE2LWExZDBlZjllNmI4YiIsIm9yZ0lkIjoiNDU4NTQ2IiwidXNlcklkIjoiNDcxNzY0IiwidHlwZUlkIjoiNGVjYmEzMTctYjFmNi00YWJiLTkzNWYtNGFlMjMzYzg3NmVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTIxNDA4MzAsImV4cCI6NDkwNzkwMDgzMH0.qfUKb78Pp6a3QaXKQO6qHr9aXACJF4ObXV9Z4Oxb8B4';
const validSolAddress = 'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5';

async function check() {
    const res = await fetch(`https://solana-gateway.moralis.io/account/mainnet/${validSolAddress}/portfolio`, {
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
    });
    const data = await res.json();
    console.log(Object.keys(data));
}
check();
