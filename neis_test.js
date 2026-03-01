const KEY = '434d6a48758f455695903eafdcee4179';
const atptCode = 'J10';
const schulCode = '7380061';

async function fetchNeis(params) {
    let url = new URL('https://open.neis.go.kr/hub/SchoolSchedule');
    url.searchParams.append('KEY', KEY);
    url.searchParams.append('Type', 'json');
    url.searchParams.append('pIndex', '1');
    url.searchParams.append('pSize', '2');
    url.searchParams.append('ATPT_OFCDC_SC_CODE', atptCode);
    url.searchParams.append('SD_SCHUL_CODE', schulCode);

    for (const [k, v] of Object.entries(params)) {
        url.searchParams.append(k, v);
    }

    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.RESULT) {
        return data.RESULT.CODE + " " + data.RESULT.MESSAGE;
    }
    if (data.SchoolSchedule) {
        return `Success! Found ${data.SchoolSchedule[0].head[0].list_total_count} items. First item: ${data.SchoolSchedule[1].row[0].AA_YMD} ${data.SchoolSchedule[1].row[0].EVENT_NM}`;
    }
    return "Unknown response";
}

async function run() {
    console.log("AY=2023:", await fetchNeis({ AY: '2023' }));
    console.log("AY=2024:", await fetchNeis({ AY: '2024' }));
    console.log("AY=2025:", await fetchNeis({ AY: '2025' }));
    console.log("AY=2026:", await fetchNeis({ AY: '2026' }));

    console.log("AA_YMD=2024:", await fetchNeis({ AA_YMD: '2024' }));
    console.log("AA_YMD=2025:", await fetchNeis({ AA_YMD: '2025' }));
    console.log("AA_YMD=2026:", await fetchNeis({ AA_YMD: '2026' }));

    console.log("AA_FROM_YMD/AA_TO_YMD 2025:", await fetchNeis({ AA_FROM_YMD: '20250101', AA_TO_YMD: '20251231' }));
    console.log("AA_FROM_YMD/AA_TO_YMD 2026:", await fetchNeis({ AA_FROM_YMD: '20260101', AA_TO_YMD: '20261231' }));
}

run();
