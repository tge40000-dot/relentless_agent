$ErrorActionPreference = "Stop"

# --- ENSURE LOCAL DIRECTORIES EXIST ---
foreach ($dir in @(".pip_cache", ".pip_temp", ".playwright")) {
    $full = Join-Path $PSScriptRoot $dir
    if (-not (Test-Path $full)) { New-Item -ItemType Directory -Path $full | Out-Null }
}

# --- API CONFIG ---
$baseUrl  = "https://api.relentlessbillionaire.com"
$adminKey = "MomandDad197054"

Write-Host "`nPUSHING DATA TO API..." -ForegroundColor Cyan

function Push-Data($endpoint, $body) {
    Invoke-RestMethod `
        -Uri "$baseUrl/api/content/$endpoint" `
        -Method POST `
        -Headers @{ "X-Admin-Key" = $adminKey } `
        -ContentType "application/json" `
        -Body $body
}

# ── 1. ARTISTS (11 total — includes Kev Kelley + enriched bios + Gucci Bam AKA) ──
$artists = @"
[{"id":"artist-kj-san","name":"KJ San The Wheelman","aka":"Shamal Rudulph","genre":"Hip-Hop / Rap","location":"Vallejo, CA","bio":"Self-taught audio engineer and rapper from Vallejo. Making music since 2006. Independently releasing tracks across all platforms.","youtube":"https://www.youtube.com/@kjsanthewheelman2983","image":"","initials":"KS","status":"active"},{"id":"artist-mr-knight-train","name":"Mr. Knight Train","aka":"K.T.","genre":"Hip-Hop / Bay Area Rap","location":"Bay Area, CA","bio":"Memphis-born, Bay Area-raised. Training Day Productions founder. 41 videos. Performed alongside The Luniz, San Quinn, RBL Posse, J-Stalin, Rappin 4-Tay, Keak Da Sneak, E-40.","youtube":"https://www.youtube.com/@TrainingDayMusic","image":"https://img.youtube.com/vi/njVPbNHB_T0/hqdefault.jpg","initials":"KT","status":"active"},{"id":"artist-freeman-williams","name":"Freeman Freejack Williams","aka":"Freejack","genre":"Hip-Hop / Production","location":"San Pablo, CA","bio":"Compton-born legendary producer. Aftermath Records lead producer under Dr. Dre. Credits include Snoop Dogg, Warren G, Wu-Tang Clan, 2Pac, Suga Free, Ray J, Damian Marley. Gutta Child Records founder.","instagram":"@freejack_music","image":"","initials":"FF","status":"active"},{"id":"artist-mistah-smo","name":"Mistah Smo","aka":"BLACKJOKER510","genre":"Hyphy 2.0 / Sideshow Music","location":"Oakland, CA","bio":"Deep East Oakland. Pioneer of 2nd Generation Hyphy 2.0. Da Don of Sideshow Music. Brakeless Dynasty. 33 videos, 6K+ BandLab plays. Featured with Keak Da Sneak.","youtube":"https://www.youtube.com/@BLACKJOKER510VIDEOS","image":"","initials":"MS","status":"active"},{"id":"artist-bam-morgan","name":"Bam Morgan","aka":"Gucci Bam","genre":"R&B / Hip-Hop","location":"Bay Area, CA","bio":"Recording artist signed to Morning Star Productions. Album: The Truth. Bay Area R&B and Hip-Hop fusion.","image":"","initials":"BM","status":"active"},{"id":"artist-demarco-evans","name":"Demarco Evans","genre":"Hip-Hop / Rap","location":"Bay Area, CA","bio":"Bay Area artist and creative collaborator in the Relentless Billionaire network.","image":"","initials":"DE","status":"active"},{"id":"artist-rock-solid-ent","name":"Rock Solid Entertainment LLC","genre":"Hip-Hop / Rap","location":"Bay Area, CA","bio":"Independent entertainment company and music label. Artists include NSMG TRUU (31K views), Prince Marley, Yung Stacks. DJ bookings, live sound, production, photography, lighting, video.","youtube":"https://www.youtube.com/@rocksolidentertainment6109","image":"","initials":"RS","status":"active"},{"id":"artist-gnarddastarr","name":"GNardDaStarr","genre":"Hip-Hop / Rap","location":"Bay Area, CA","bio":"Bay Area rapper and content creator. Featured in Gnard And Grumps Take Vegas with 26K+ views. Consistent output across YouTube and Instagram.","youtube":"https://www.youtube.com/@GNardDaStarr","instagram":"@gnarddastarr","image":"","initials":"GD","status":"active"},{"id":"artist-thrilly-gobad","name":"Thrilly GoBad","aka":"ThrillyGoBad","genre":"Hip-Hop / Rap","location":"Bay Area, CA","bio":"Bay Area rapper with gritty street anthems. Off My Azz hit 10K+ views. Not This Gang ft. BabyGleeko. Again ft. Islandgang Skii. Ether ENT / Bther Gang.","instagram":"@Thrilly_GoBad","image":"https://img.youtube.com/vi/RDEF7hCeLbU/hqdefault.jpg","initials":"TG","status":"active"},{"id":"artist-calyboikd","name":"CalyBoi KD","aka":"CALYBOIKD","genre":"Hip-Hop / Rap","location":"Bay Area, CA","bio":"Bay Area rapper. 13 videos spanning over a decade. Cant Wait (4.9K views), Bay Watch (2.8K views). Music video DarK via Live Entertainment LLC.","youtube":"https://www.youtube.com/@calyboikd","instagram":"@CalyBoiKd","image":"","initials":"CK","status":"active"},{"id":"artist-kev-kelley","name":"Kev Kelley","genre":"Hip-Hop / Rap","location":"Bay Area, CA","bio":"Bay Area rapper. Latest single Decoy out now on all platforms. Consistent releases with a loyal following.","instagram":"@kevkelley","youtube":"https://www.youtube.com/@KevKelley","image":"","initials":"KK","status":"active"}]
"@
Push-Data "artists" $artists
Write-Host "Artists (11) pushed" -ForegroundColor Green

# ── 2. SERVICES (4) ──
$services = @"
[{"id":"svc-lead-gen","name":"AI-Powered Lead Generation","price":500,"displayPrice":"$500/project","description":"Automated prospect research, list building, and outreach sequences powered by AI.","features":["50-100 qualified leads","AI-powered prospect matching","Custom outreach sequences","Weekly performance reports"],"category":"marketing","status":"active"},{"id":"svc-flyer","name":"Custom Event Flyer Design","price":200,"displayPrice":"$200/flyer","description":"Professional event flyers with luxury aesthetic. Print-ready and social-optimized formats.","features":["2 revision rounds","Print-ready PDF","Instagram/Facebook optimized sizes","24-48 hour turnaround"],"category":"creative","status":"active"},{"id":"svc-outreach","name":"Targeted Outreach Campaign","price":1000,"displayPrice":"$1,000/campaign","description":"Full-service outreach to venues, sponsors, and partners.","features":["Custom pitch deck","Email sequences","Phone follow-up","Campaign analytics dashboard"],"category":"marketing","status":"active"},{"id":"svc-consulting","name":"1-on-1 Business Consulting","price":2000,"displayPrice":"$2,000/session","description":"Strategic business consulting with Christopher. Brand architecture, revenue modeling, and growth strategy.","features":["90-minute deep dive session","Custom action plan","30-day follow-up support","Revenue modeling spreadsheet"],"category":"strategy","status":"active"}]
"@
Push-Data "store_services" $services
Write-Host "Services (4) pushed" -ForegroundColor Green

# ── 3. MEMBERSHIPS (3) ──
$memberships = @"
[{"id":"tier-starter","name":"STARTER","price":49,"discount":10,"perks":["10% off all services","Early event access","Monthly newsletter","Community Discord access"],"featured":false,"status":"active"},{"id":"tier-pro","name":"PRO","price":199,"discount":25,"perks":["25% off all services","Priority booking","Free event flyer per month","1-on-1 monthly check-in","VIP event access"],"featured":true,"status":"active"},{"id":"tier-elite","name":"ELITE","price":499,"discount":40,"perks":["40% off all services","Unlimited priority booking","2 free flyers per month","Weekly strategy calls","VIP + backstage access","Featured on homepage"],"featured":false,"status":"active"}]
"@
Push-Data "memberships" $memberships
Write-Host "Memberships (3) pushed" -ForegroundColor Green

# ── 4. VENDORS (1) ──
$vendors = @"
[{"id":"cook-gotdatgumbo","name":"Got Dat Gumbo","owner":"Jabari Hopkins","specialty":"Gumbo","tagline":"Best Gumbo around","type":"Pop-Up Food Vendor","services":["Event Catering","Pop-Up Kitchen","Private Orders"],"location":"Bay Area, CA","instagram":"https://www.instagram.com/gotdatgumbo/","bio":"Best bowls in the Bay Area. Available for event catering, pop-ups, and private orders through the Relentless Billionaire network.","featured":true,"status":"active"}]
"@
Push-Data "vendors" $vendors
Write-Host "Vendors (1) pushed" -ForegroundColor Green

# ── 5. EVENTS (2) ──
$events = @"
[{"id":"evt-april25","name":"Relentless Billionaire Live","date":"2026-04-25","time":"9:00 PM","location":"Bay Area, CA - Venue TBA","description":"Doors open at 9 PM. Free entry. Live performances from the full RB roster, DJ sets, food vendors, and networking. The Bay comes together for one night. Pull up.","price":"FREE","flyerImage":"","rsvpLink":"","status":"active"},{"id":"evt-weekly-openmic","name":"RB Open Mic Night","date":"Every Thursday","time":"7:00 PM","location":"Bay Area, CA - Rotating Venues","description":"Weekly open mic for artists in the Relentless Billionaire network. Sign up on-site. All genres welcome. Free entry, cash prizes for top performers.","price":"FREE","flyerImage":"","rsvpLink":"","status":"active"}]
"@
Push-Data "events" $events
Write-Host "Events (2) pushed" -ForegroundColor Green

Write-Host "`nALL DATA LIVE v3 — 11 Artists, 4 Services, 3 Memberships, 1 Vendor, 2 Events" -ForegroundColor Yellow
