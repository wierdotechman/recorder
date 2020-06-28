class Recorder {
  constructor() {
    this.stream = null;
    this.videoData = [];
    this.mediaRecorder = null;
    this.constraints = null;
    this.setupClickListeners();
  }

  get tracks() {
    return this.stream.getTracks();
  }

  get localPreview() {
    return document.querySelector('video#localPreview');
  }

  get recordedPreview() {
    return document.querySelector('video#recordedPreview');
  }

  setupClickListeners() {
    document.querySelector('button#startRecording').addEventListener('click', this.startRecording.bind(this));
    document.querySelector('button#stopRecording').addEventListener('click', this.stopRecording.bind(this));
    document.querySelector('button#downloadRecording').addEventListener('click', this.downloadRecording.bind(this));
  }

  async startRecording() {
    const { checked: isMicEnabled } = document.querySelector('#recordMic');
    const { checked: isWebcamEnabled } = document.querySelector('#recordWebcam');
    const { checked: isScreenEnabled } = document.querySelector('#recordScreen');
    const userMediaConstraints = {
      audio: isMicEnabled || false,
      video: isWebcamEnabled || false
    };
    const displayMediaConstraints = {
      video: isScreenEnabled || false
    }

    if (!isScreenEnabled && !isMicEnabled) {
      document.querySelector('div#errorMessage').classList.remove('hide');
      return;
    }
    document.querySelector('div#errorMessage').classList.add('hide');
    await this.getStream(userMediaConstraints, displayMediaConstraints);
    this.setupLocalPreview();
    this.setupMediaRecorder();
    document.querySelector('button#startRecording').disabled = true;
    document.querySelector('button#stopRecording').classList.remove('hide');
  }

  stopRecording() {
    const { mediaRecorder, tracks } = this;
    if (!mediaRecorder)
      return;
    mediaRecorder.stop();
    (tracks || []).forEach((track) => track.stop());
    this.localPreview.srcObject = null;
    document.querySelector('button#startRecording').disabled = false;
    document.querySelector('button#stopRecording').classList.add('hide');
    document.querySelector('button#downloadRecording').classList.remove('hide');
  }

  downloadRecording()  {
    if (!this.recordedPreview.src)
      return;
    const anchor = document.createElement('a');
    anchor.style = 'display: none;';
    anchor.href = this.recordedPreview.src;
    anchor.download = `video_${new Date().toISOString()}.webm`;
    document.body.append(anchor);
    anchor.click();
    this.recordedPreview.src = null;
    window.URL.revokeObjectURL(this.recordedPreview.src);
    document.body.removeChild(anchor);
  }

  async getStream(userMediaConstraints = {}, displayMediaConstraints = {}) {
    let tracks = [];
    let userMediaStream, displayMediaSteam = {};
    if (userMediaConstraints.audio || userMediaConstraints.video) {
      userMediaStream = await navigator.mediaDevices.getUserMedia(userMediaConstraints);
      tracks.push(...userMediaStream.getVideoTracks(), ...userMediaStream.getAudioTracks());
    }
    if (displayMediaConstraints.video) {
      displayMediaSteam = await navigator.mediaDevices.getDisplayMedia(displayMediaConstraints);
      tracks.push(...displayMediaSteam.getTracks());
    }
    const stream = new MediaStream(tracks);
    this.stream = stream;
    return stream;
  }

  setupLocalPreview() {
    const videoElement = this.localPreview;
    videoElement.srcObject = this.stream;
    this.localPreview.classList.remove('hide');
    this.recordedPreview.classList.add('hide');
    document.querySelector('#playerBanner').classList.add('hide');
    document.querySelector('#playerMessage').classList.remove('hide');
  }

  setupRecordedPreview() {
    const blob = new Blob(this.videoData, { type: 'video/webm' });
    const previewURL = window.URL.createObjectURL(blob);
    this.recordedPreview.src = previewURL;
    this.videoData = [];
    this.localPreview.classList.add('hide');
    this.recordedPreview.classList.remove('hide');
  }

  setupMediaRecorder() {
    const options = { mimeType: 'video/webm' };
    const mediaRecorder = new MediaRecorder(this.stream, options);
    mediaRecorder.ondataavailable = (event) => {
      this.videoData.push(event.data);
    };
    mediaRecorder.onstop = () => {
      this.setupRecordedPreview();
    };
    this.mediaRecorder = mediaRecorder;
    this.mediaRecorder.start();
  }
}

window.onload = () => {
  new Recorder();
}