import * as THREE from "three";
import CameraControls from "camera-controls";
import axios from "axios";
import parseJSON, { findThreeJSJSON } from "../utils/parse-json";
import * as uuid from "uuid";
import * as RX from "rxjs";

CameraControls.install({ THREE });

export type ViewerStatus = "loading" | "error" | "idle";

class Viewer {
  public id: string;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  private _renderer: THREE.WebGLRenderer;
  private _cameraControl: CameraControls;
  private _renderNeeded = true;
  private _clock = new THREE.Clock();
  private _raycaster = new THREE.Raycaster();
  private _mouse = new THREE.Vector2();
  private _selectedObject: THREE.Object3D | null = null;

  public model: THREE.Object3D | undefined;

  public status = new RX.BehaviorSubject<ViewerStatus>("idle");

  constructor(container: HTMLDivElement) {
    this.id = uuid.v4();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#333333");
    this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    this.camera.position.set(10, 10, 10);

    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this._renderer.domElement);

    this._cameraControl = new CameraControls(
        this.camera,
        this._renderer.domElement
    );

    this._cameraControl.dollyToCursor = true;
    this._cameraControl.dollySpeed = 0.4;
    this._cameraControl.draggingSmoothTime = 0;
    this._cameraControl.smoothTime = 0;
    this._cameraControl.mouseButtons.right = CameraControls.ACTION.ROTATE;
    this._cameraControl.mouseButtons.left = CameraControls.ACTION.NONE;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    this.scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    window.addEventListener("resize", this.resize);


    this._renderer.domElement.addEventListener("click", this.onMouseClick);

    this.loadModel().then((object3d) => {
      if (object3d) {
        object3d.rotateX(-Math.PI / 2);
        this.scene.add(object3d);
        const boundingBox = new THREE.Box3().setFromObject(object3d);
        this._cameraControl.fitToBox(boundingBox, false);
        this.model = object3d;
        this.status.next("idle");
      }
    });

    this.updateViewer();
  }

  public updateViewer() {
    this._renderNeeded = true;
    this._render();
  }

  private resize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderNeeded = true;
    this.updateViewer();
  };

  private _render = () => {
    const clockDelta = this._clock.getDelta();
    const hasControlsUpdated = this._cameraControl.update(clockDelta);

    if (hasControlsUpdated || this._renderNeeded) {
      this._renderer.render(this.scene, this.camera);
      this._renderNeeded = false;
    }

    window.requestAnimationFrame(this._render);
  };

  private async loadModel() {
    this.status.next("loading");

    try {
      const modelUrl =
          "https://storage.yandexcloud.net/lahta.contextmachine.online/files/pretty_ceiling_props.json";

      const response = await axios.get(modelUrl, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      const data = response.data;

      const jsonObject = findThreeJSJSON(data);
      if (jsonObject) {
        const object3d = await parseJSON(jsonObject);
        this.assignPropertyValues(object3d);
        this.addLabelsToModel(object3d);
        return object3d;
      }
    } catch {
      this.status.next("error");
      throw new Error("Failed to load model");
    }
  }

  private addTextLabel(object: THREE.Object3D) {
    const { statusCode, statusText } = object.userData.propertyValue || {};

    if (statusCode && statusText) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;


      canvas.width = 100;
      canvas.height = 20;


      let textColor = "white";
      let backgroundColor = "black";

      switch (statusCode) {
        case 1: // Not Started
          backgroundColor = "rgba(255, 0, 0, 0.8)";
          break;
        case 2: // In Progress
          backgroundColor = "rgba(255, 165, 0, 0.8)";
          break;
        case 3: // Partially Installed
          backgroundColor = "rgba(0, 255, 0, 0.8)";
          break;
        case 4: // Installed
          backgroundColor = "rgba(0, 0, 255, 0.8)";
          break;
        default:
          backgroundColor = "rgba(0, 0, 0, 0.8)";
      }


      const cornerRadius = canvas.height / 2;
      context.beginPath();
      context.moveTo(cornerRadius, 0);
      context.arcTo(canvas.width, 0, canvas.width, canvas.height, cornerRadius);
      context.arcTo(canvas.width, canvas.height, 0, canvas.height, cornerRadius);
      context.arcTo(0, canvas.height, 0, 0, cornerRadius);
      context.arcTo(0, 0, canvas.width, 0, cornerRadius);
      context.closePath();

      context.fillStyle = backgroundColor;
      context.fill();


      context.fillStyle = textColor;
      context.font = "12px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`${statusText}`, canvas.width / 2, canvas.height / 2);


      const texture = new THREE.CanvasTexture(canvas);


      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.3, 0.1, 0.3);
      sprite.position.set(0, 0.2, 0);

      object.add(sprite);
    }
  }

  private addLabelsToModel(model: THREE.Object3D) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.addTextLabel(child);
      }
    });
  }

  private assignPropertyValues(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {

        const progressStatuses: any = {
          1: "Not Started",
          2: "In Progress",
          3: "Partially Installed",
          4: "Installed",
        };


        const statusIndex: number = (child.id % 4) + 1;
        child.userData.propertyValue = {
          statusCode: statusIndex,
          statusText: progressStatuses[statusIndex],
        };
      }
    });

    console.log("Updated Model with Installation Progress:", object);
  }


  private onMouseClick = (event: MouseEvent) => {

    this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    this._raycaster.setFromCamera(this._mouse, this.camera);


    const intersects = this._raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;


      if (this._selectedObject) {
        this.resetObjectMaterial(this._selectedObject);
      }


      this._selectedObject = selectedObject;
      this.highlightObject(selectedObject);
    } else {

      if (this._selectedObject) {
        this.resetObjectMaterial(this._selectedObject);
        this._selectedObject = null;
      }
    }
  };

  highlightObject(object: THREE.Object3D) {
    if (this._selectedObject) {
      this.resetObjectMaterial(this._selectedObject);
    }
    this._selectedObject = object;

    if (object instanceof THREE.Mesh) {
      object.userData.originalMaterial = object.material;
      object.material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      });
    }
  }

  resetObjectMaterial(object: THREE.Object3D) {
    if (object instanceof THREE.Mesh && object.userData.originalMaterial) {
      object.material = object.userData.originalMaterial;
      delete object.userData.originalMaterial;
    }
  }


  public dispose() {
    window.removeEventListener("resize", this.resize);
    this._renderer.domElement.removeEventListener("click", this.onMouseClick);
    this._renderer.domElement.remove();
    this._renderer.dispose();
    this._cameraControl.dispose();
    this.scene.clear();
    this._renderNeeded = false;
  }
}

export default Viewer;