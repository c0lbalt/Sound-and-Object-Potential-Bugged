let selectedColor = "black"; // Default color
let colors = ["red", "orange", "yellow", "green", "cyan", "blue", "pink", "brown", "white", "black"];
let paletteX = 10, paletteY = 10, squareSize = 15;

// Sound variables
let synth;
let backgroundSynth;
let filter;
let delay;
let reverb;
let isPlaying = false;
let lastPaintTime = 0;
let paintCount = 0;
let clearCanvas = false;


function setup() {
  createCanvas(800, 600);
  background(255); // Clear canvas only once
  
  // Initialize sound
  synth = new Tone.Synth({
    volume: -20,  // Add volume control for painting sounds
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.1,
      release: 0.1
    }
  }).toDestination();
  backgroundSynth = new Tone.PolySynth().toDestination();
  filter = new Tone.Filter(400, "lowpass").toDestination();
  delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
  reverb = new Tone.Reverb(10).toDestination();
  
  // Connect synths to effects
  synth.connect(filter);
  synth.connect(delay);
  synth.connect(reverb);
  backgroundSynth.connect(filter);
  backgroundSynth.connect(delay);
  backgroundSynth.connect(reverb);
  
  // Start background music
  startBackgroundMusic();
}

function startBackgroundMusic() {
  if (!isPlaying) {
    isPlaying = true;
    Tone.start();
    playBackgroundPattern();
  }
}

function playBackgroundPattern() {
  // Stop any existing patterns
  Tone.Transport.stop();
  
  // Create a gentle ambient progression
  const chords = [
    ['E3', 'G3', 'B3', 'D4'],    // Em7
    ['A3', 'C4', 'E4', 'G4'],    // Am7
    ['D3', 'F3', 'A3', 'C4'],    // Dm7
    ['G3', 'B3', 'D4', 'F4']     // G7
  ];
  
  // Set a slow, peaceful tempo
  Tone.Transport.bpm.value = 100;
  
  // Create a pattern that plays each chord with arpeggios
  const pattern = new Tone.Pattern((time, chord) => {
    // Play soft pad-like chord
    backgroundSynth.set({
      volume: -37,
      envelope: {
        attack: 0.5,
        decay: 1,
        sustain: 0.8,
        release: 2
      }
    });
    
    // Play the base chord softly
    backgroundSynth.triggerAttackRelease(chord, "2n", time, 0.3);
    
    // Add gentle arpeggios
    chord.forEach((note, index) => {
      // Delayed arpeggio notes
      backgroundSynth.triggerAttackRelease(
        note, 
        "4n", 
        time + (index * 0.25), 
        0.1
      );
    });
    
  }, chords, "up");
  
  // Add ambient effects
  reverb.set({
    decay: 8,
    wet: 0.7
  });
  
  delay.set({
    delayTime: "8n",
    feedback: 0.4,
    wet: 0.3
  });
  
  filter.set({
    frequency: 2000,
    type: "lowpass",
    Q: 1
  });
  
  // Set longer interval between chord changes
  pattern.interval = "2n";
  pattern.start(0);
  Tone.Transport.start();
}

function draw() {
  drawPalette();
  
  // Adapt background music based on paint density
  const paintDensity = paintCount / (width * height);
  filter.frequency.value = 400 + (paintDensity * 2000);
  delay.feedback.value = 0.3 + (paintDensity * 0.4);
  reverb.wet.value = 0.2 + (paintDensity * 0.3);

  drawClearButton();  
}

function drawPalette() {
  for (let i = 0; i < colors.length; i++) {
    fill(colors[i]);
    square(paletteX, paletteY + i * squareSize, squareSize);
  }
}

function mousePressed() {
  // Check if the click is inside the palette area
  if (mouseX >= paletteX && mouseX <= paletteX + squareSize) {
    let index = Math.floor((mouseY - paletteY) / squareSize);
    if (index >= 0 && index < colors.length) {
      selectedColor = colors[index];
      const note = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'][index];
      synth.triggerAttackRelease(note, "8n");
      console.log("Selected Color:", selectedColor);
    }
  }
  
  // Check if clear button is clicked
  if (mouseX >= width - 50 && mouseX <= width - 10 && 
      mouseY >= 10 && mouseY <= 50) {
    background(255);
    paintCount = 0;
    // Play clear sound
    synth.triggerAttackRelease(['C2', 'G2', 'C3'], "4n");
  }
}

function mouseDragged() {
  // Prevent painting over the palette
  if (mouseX > paletteX + squareSize + 10) { 
    fill(selectedColor);
    noStroke();
    circle(mouseX, mouseY, 10);
    
    // Play painting sound effect
    const now = millis();
    if (now - lastPaintTime > 50) { // Limit sound frequency
      const note = ['C3', 'E3', 'G3', 'B3'][Math.floor(Math.random() * 4)];
      synth.triggerAttackRelease(note, "32n");
      lastPaintTime = now;
      paintCount++;
    }
  }
}

function keyPressed() {
  if (key === 'c' || key === 'C') {
    // Clear canvas
    background(255);
    paintCount = 0;
    // Play clear sound
    synth.triggerAttackRelease(['C2', 'G2', 'C3'], "4n");
  }
}

function drawClearButton() {
  // Draw button background
  stroke(0);
  fill(220);
  rect(width - 50, 10, 40, 40, 5); // Added rounded corners
  
  // Draw button text
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(10);
  text("Clear", width - 30, 30);
}

/* 
Click and Drag mouse to apply paint
Click on color palette boxes to set color.
Press 'Clear' button to clear the canvas, it plays a chord (sustained until interacted with canvas.)

PAINT SHOULD NOT BE ABLE TO APPLY OVER THE PALETTE!

Sound Features:
- Background music adapts to painting density
- Color selection plays different notes
- Painting creates rhythmic sounds
- Clearing canvas plays a chord
- Effects (filter, delay, reverb) change based on canvas state
*/