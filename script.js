console.log("Console is Working");

let currentSong = new Audio();
let songs = [];
let currFolder = "";
let currentIndex = 0;

const playButton = document.querySelector("#play");
const nextButton = document.querySelector("#next");
const prevButton = document.querySelector("#prev");
const volumeButton = document.querySelector("#vol");

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function getSongs(folder) {
    currFolder = folder;

    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];

        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
            <li class="grey-outer">
                <img src="Images/music.svg" alt="">
                <div class="info">
                    <div>${decodeURIComponent(song)}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img width="32" src="Images/play.svg" alt="">
                </div>
            </li>
        `;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            currentIndex = index;
            playMusic(songs[currentIndex]);
        });
    });
}

function playMusic(track, pause = false) {
    if (!track) return;

    currentSong.src = `/${currFolder}/${track}`;

    if (!pause) {
        currentSong.play();
        playButton.src = "Images/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track).replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    console.log("Displaying albums");

    let a = await fetch("/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        let href = e.getAttribute("href");

        if (href && href.endsWith("/") && href !== "../" && href !== "./") {
            let folder = href.replace(/\/$/, "").split("/").pop();

            if (folder === "songs" || folder === "" || folder === ".") continue;

            try {
                let a = await fetch(`/songs/${folder}/info.json`);

                if (!a.ok) continue;

                let response = await a.json();

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="Images/play.svg" alt="play">
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>
                `;
            }
            catch (error) {
                console.log(`Could not load album ${folder}`, error);
            }
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            let folder = `songs/${card.dataset.folder}`;

            await getSongs(folder);

            currentIndex = 0;

            if (songs.length > 0) {
                playMusic(songs[0]);
            }
        });
    });
}

playButton.addEventListener("click", () => {
    if (currentSong.paused) {
        currentSong.play();
        playButton.src = "Images/pause.svg";
    }
    else {
        currentSong.pause();
        playButton.src = "Images/play.svg";
    }
});

currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML =
        `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;

    if (currentSong.duration) {
        let percent = currentSong.currentTime / currentSong.duration;

        document.querySelector(".circle").style.left = `${percent * 100}%`;

        document.querySelector(".seekbar").style.background =
            `linear-gradient(
                to right,
                #1fd760 0%,
                #1fd760 ${percent * 103}% ,
                black ${percent * 103}% ,
                black 100%
            )`;
    }
});

document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = e.offsetX / e.currentTarget.getBoundingClientRect().width;

    document.querySelector(".circle").style.left = `${percent * 100}%`;

    if (currentSong.duration) {
        currentSong.currentTime = currentSong.duration * percent;
    }
});

nextButton.addEventListener("click", () => {
    if (songs.length === 0) return;

    currentIndex++;

    if (currentIndex >= songs.length) {
        currentIndex = 0;
    }

    playMusic(songs[currentIndex]);
});

prevButton.addEventListener("click", () => {
    if (songs.length === 0) return;

    currentIndex--;

    if (currentIndex < 0) {
        currentIndex = songs.length - 1;
    }

    playMusic(songs[currentIndex]);
});

document.querySelector(".range input").addEventListener("input", e => {
    currentSong.volume = parseInt(e.target.value) / 100;
});

let prevVol = currentSong.volume;

volumeButton.addEventListener("click", () => {
    if (currentSong.volume !== 0) {
        prevVol = currentSong.volume;
        currentSong.volume = 0;
        document.querySelector(".range input").value = 0;
        volumeButton.src = "Images/silent.svg";
    }
    else {
        currentSong.volume = prevVol;
        document.querySelector(".range input").value = prevVol * 100;
        volumeButton.src = "Images/volume.svg";
    }
});

async function main() {
    try {
        await getSongs("songs/ncs");

        if (songs.length > 0) {
            playMusic(songs[0], true);
        }

        await displayAlbums();

        console.log("Everything loaded successfully");
    }
    catch (error) {
        console.error("ERROR IN MAIN:", error);
    }
}

main();