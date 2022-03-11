let video;
let webcamStream;
let canvas, ctx, canvas1, ctx1;
let modalDetailInfor;
let btnStartCamElm;
let btnStopCamElm;
let btnTakeSnapshotElm;
let isScanPicture = false;
let facingMode = "environment";
let errorMessageString;
let payloadString;
let scanVideoElm;
let loadingSpinnerElm;
let driverNameElm;
let driverAddressElm;
let driverExpireDateElm;
let driverBirthDayElm;
let payloadObject = {};

// document.addEventListener("DOMContentLoaded", initWebPage);
const startWebcam = () => {
  const constraints = {
    audio: false,
    video: isMobile()
      ? {
          facingMode: facingMode,
        }
      : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
  };

  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  navigator
    .getUserMedia(constraints, (localMediaStream) => {
      video.srcObject = localMediaStream;
      webcamStream = localMediaStream;
      btnTakeSnapshotElm.classList.remove("disabled");
      btnStopCamElm.classList.remove("disabled");
      btnStopCamElm.disabled = false;
      btnTakeSnapshotElm.disabled = false;
    }, (error) => {
      console.log("The following error occured: " + error);
    })
}

const stopWebcam = () => {
  webcamStream.getTracks().forEach((track) => {
    track.stop();
  });
  video.srcObject = null;
  webcamStream = null;
  btnTakeSnapshotElm.classList.add("disabled");
  btnStopCamElm.classList.add("disabled");
  btnStopCamElm.disabled = true;
  btnTakeSnapshotElm.disabled = true;
};

const initWebPage = () => {
  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  // canvas1 = document.getElementById("myCanvas");
  // ctx1 = canvas1.getContext("2d");
  canvas.width = 500;
  canvas.height = 600;
  btnTakeSnapshotElm = document.querySelector(".btn-take-snapshot");
  btnStartCamElm = document.querySelector(".btn-start-cam");
  btnStopCamElm = document.querySelector(".btn-stop-cam");
  driverNameElm = document.querySelector(".full-name");
  driverAddressElm = document.querySelector(".address");
  driverExpireDateElm = document.querySelector(".expire-date");
  driverBirthDayElm = document.querySelector(".birth-day");
  video = document.querySelector("#video");
  video.setAttribute("autoplay", "");
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
};

const snapshotPicture = () => {
  if (webcamStream) {
    btnStopCamElm.classList.add("disabled");
    btnTakeSnapshotElm.classList.add("disabled");
    btnStopCamElm.disabled = true;
    btnTakeSnapshotElm.disabled = true;
    var img_w = video.videoWidth;
    var img_h = video.videoHeight;
    canvas.width = img_w;
    canvas.height = img_h;
    // canvas1.width = img_w;
    // canvas1.height = img_h;
    // ctx1.drawImage(video, 0, 0, img_w, img_h);
    ctx.drawImage(video, 0, 0, img_w, img_h);
    const imageData = ctx.getImageData(0, 0, img_w, img_h);
    const uint8ArrData = new Uint8Array(imageData.data);
    scanVideoElm = document.querySelector(".cam-effect-scan");
    loadingSpinnerElm = document.querySelector(".cam-loading-spinner");
    let percenScan = 0;
    const scanProgressInterval = setInterval(() => {
      percenScan += 10;
      if (percenScan <= 100) {
        scanVideoElm.classList.add("active");
      }
    }, 100);
    setTimeout(() => {
      loadingSpinnerElm.classList.add("d-flex");
      loadingSpinnerElm.classList.remove("d-none");
      scanVideoElm.classList.remove("active");
      clearInterval(scanProgressInterval);
      percenScan = 0;
    }, 1100);
    setTimeout(() => {
      passToWasm(uint8ArrData, img_w, img_h);
    }, 1200);
  }
};

const handleCloseModal = () => {
  modalDetailInfor.hide();
};

Module.onRuntimeInitialized = () => {};
const passToWasm = (imageData, wid, hig) => {
  try {
    const { length } = imageData;
    const memory = Module._malloc(length); // Allocating WASM memory
    HEAPU8.set(imageData, memory); // Copying JS image data to WASM memory
    let errorMessageAray = new Uint8Array(1000);
    let errorMessagePointer = _malloc(1000 * Uint8Array.BYTES_PER_ELEMENT);
    HEAPU8.set(
      errorMessageAray,
      errorMessagePointer / Uint8Array.BYTES_PER_ELEMENT
    );

    let payloadArray = new Uint8Array(1000);
    let payloadPointer = _malloc(1000 * Uint8Array.BYTES_PER_ELEMENT);
    HEAPU8.set(payloadArray, payloadPointer / Uint8Array.BYTES_PER_ELEMENT);

    _ocr_ncnn(memory, wid, hig, payloadPointer, errorMessagePointer);

    let errorMessageResult = HEAPU8.subarray(
      errorMessagePointer / Uint8Array.BYTES_PER_ELEMENT,
      errorMessagePointer / Uint8Array.BYTES_PER_ELEMENT + 1000
    );
    errorMessageString = new TextDecoder("utf8")
      .decode(errorMessageResult)
      .trim();
    errorMessageString = errorMessageString
      .replaceAll("\u0000", "")
      .replaceAll("\r", "");

    let payloadResult = HEAPU8.subarray(
      payloadPointer / Uint8Array.BYTES_PER_ELEMENT,
      payloadPointer / Uint8Array.BYTES_PER_ELEMENT + 1000
    );
    payloadString = new TextDecoder("utf8").decode(payloadResult).trim();
    payloadString = payloadString.replaceAll("\u0000", "").replaceAll("\r", "");
    payloadObject = JSON.parse(payloadString);
    resetEffectScanImg();
    if (payloadString && !errorMessageString) {
      onSucess(payloadString);
    } else {
      onError();
    }
    Module._free(memory); // Freeing WASM memory
    Module._free(errorMessagePointer); // Freeing WASM memory
    Module._free(payloadPointer); // Freeing WASM memory
  } catch (error) {
    console.log("error========", error);
  }
};

const resetEffectScanImg = () => {
  loadingSpinnerElm.classList.add("d-none");
  loadingSpinnerElm.classList.remove("d-flex");
  btnStopCamElm.classList.remove("disabled");
  btnStopCamElm.disabled = false;
  btnTakeSnapshotElm.classList.remove("disabled");
  btnTakeSnapshotElm.disabled = false;
};

const onSucess = () => {
  Swal.fire({
    title: "Success!",
    icon: "success",
    text: "",
    width: "400px",
  }).then((result) => {
    if (result.isConfirmed) {
      getDetailInforOfDriver();
      modalDetailInfor = new bootstrap.Modal(
        document.getElementById("modal-detail-infor"),
        {
          backdrop: true,
        }
      );
      modalDetailInfor.show();
    }
  });
};

const onError = () => {
  payloadObject = {};
  getDetailInforOfDriver();
  Swal.fire({
    title: "Error",
    icon: "Oops...",
    text: "Something went wrong!",
    width: "400px",
  });
};

const getDetailInforOfDriver = () => {
  driverNameElm.innerText = payloadObject.name || "";
  driverAddressElm.innerText = payloadObject.address || "";
  driverBirthDayElm.innerText = payloadObject.birthOfDay || "";
  driverExpireDateElm.innerText = payloadObject.expireDate || "";
};

