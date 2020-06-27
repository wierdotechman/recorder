class Recorder {
  constructor() {
    this.stream = null;
    this.videoData = [];
    this.mediaRecorder = null;
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
    const constraints = {
      audio: false,
      video: true
    };
    await this.getStream(constraints);
    this.setupLocalPreview();
    this.setupMediaRecorder();
  }

  stopRecording() {
    const { mediaRecorder, tracks } = this;
    mediaRecorder.stop();
    (tracks || []).forEach((track) => track.stop());
    this.localPreview.srcObject = null;
  }

  downloadRecording()  {
    const anchor = document.createElement('a');
    anchor.style = 'display: none;';
    anchor.href = this.recordedPreview.src;
    anchor.download = `video_${new Date().toISOString()}`;
    document.body.append(anchor);
    anchor.click();
    window.URL.revokeObjectURL(this.recordedPreview);
    this.recordedPreview.src = null;
    document.body.removeChild(anchor);
  }

  async getStream(config = {}) {
    const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    const videoStream = await navigator.mediaDevices.getDisplayMedia(config);
    const tracks = [...videoStream.getTracks(), ...audioStream.getAudioTracks()];
    const stream = new MediaStream(tracks);
    this.stream = stream;
    return stream;
  }

  setupLocalPreview() {
    const videoElement = this.localPreview;
    videoElement.srcObject = this.stream;
  }

  setupRecordedPreview() {
    const blob = new Blob(this.videoData, { type: 'video/webm' });
    const previewURL = window.URL.createObjectURL(blob);
    this.recordedPreview.src = previewURL;
    this.videoData = [];
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