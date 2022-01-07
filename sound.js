import { hslToRgb } from "./utils";

// create width and height variables (all the calculations will be based off them)
//Higher numbers slow down computers while lower ones make them more responsive
const WIDTH = 1500;
const HEIGHT = 1500;

//grab the canvas and the context
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;

//
let analyzer;
let bufferLength;

//error handling function
function handleError() {
  console.log("You must give access to your mic in order to proceed");
}

// get the audio and the data about the frequency, time ...
async function getAudio() {
  //get access to the user's microphone
  const stream = await navigator.mediaDevices
    .getUserMedia({ audio: true })
    .catch(handleError);

  //get the audio context in the browser
  const audioCtx = new AudioContext();
  analyzer = audioCtx.createAnalyser();
  //create a source that'll take the stream and pipe it into the audio ctx then connect it to the analyzer
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyzer);

  //determine how much data you want to collect
  analyzer.fftSize = 2 ** 10;
  bufferLength = analyzer.frequencyBinCount;
  //pull the data off the audio. Grab it in an array (each array can only be 8 bites of 1  byte)
  const timeData = new Uint8Array(bufferLength);
  // do the same for the frequency
  const frequencyData = new Uint8Array(bufferLength);

  drawTimeData(timeData);
  drawFrequency(frequencyData);
}

function drawTimeData(timeData) {
  //inject the time data into the timeData array
  analyzer.getByteTimeDomainData(timeData);
  //add the UI
  //clear the canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  //set it up
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffc600";
  ctx.beginPath();
  const sliceWidth = WIDTH / bufferLength;
  let x = 0;
  timeData.forEach((data, i) => {
    const v = data / 128;
    const y = (v * HEIGHT) / 1.5;
    //draw the lines
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  });
  ctx.stroke();
  //make the function call itself ASAP
  requestAnimationFrame(() => drawTimeData(timeData));
}

function drawFrequency(frequencyData) {
  //get the frequency data into the frequencyData array
  analyzer.getByteFrequencyData(frequencyData);

  //add the UI
  //figure out the bar width
  const barWidth = (WIDTH / bufferLength) * 2.5;
  let x = 0;
  frequencyData.forEach((amount) => {
    const percent = amount / 255;
    const [h, s, l] = [360 / (percent * 360), 0.5, 0.8, 0.5];
    const barHeight = HEIGHT * percent * 0.5;
    //convert the color to HSL
    const [r, g, b] = hslToRgb(h, s, l);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
    x += barWidth + 2;
  });
  // make it call itself
  requestAnimationFrame(() => drawFrequency(frequencyData));
}

getAudio();
