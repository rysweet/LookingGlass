import { EntityImp } from "./expanded-implementation-entities-core";
import {
  NumberProperty,
  PropertyOwnerImp,
  StringProperty,
  type SceneActivationController,
  type SceneActivationListener,
} from "./expanded-implementation-properties";

export class SceneImp extends EntityImp {
  readonly atmosphereColor = this.registerProperty(new StringProperty<string | null>(this, "atmosphereColor", null, true));
  readonly fromAboveLightColor = this.registerProperty(new StringProperty<string | null>(this, "fromAboveLightColor", null, true));
  readonly fromBelowLightColor = this.registerProperty(new StringProperty<string | null>(this, "fromBelowLightColor", null, true));
  readonly fogDensity = this.registerProperty(new NumberProperty(this, "fogDensity", 0, { min: 0 }));
  readonly #sceneActivationListeners = new Set<SceneActivationListener>();
  #activationCount = 0;

  addSceneActivationListener(listener: SceneActivationListener): void {
    this.#sceneActivationListeners.add(listener);
  }

  removeSceneActivationListener(listener: SceneActivationListener): void {
    this.#sceneActivationListeners.delete(listener);
  }

  get activationCount(): number {
    return this.#activationCount;
  }

  override activate(): void {
    const wasActive = this.isActive;
    super.activate();
    if (!wasActive && this.isActive) {
      this.#activationCount += 1;
      this.#notifySceneActivation(true);
    }
  }

  override deactivate(): void {
    const wasActive = this.isActive;
    super.deactivate();
    if (wasActive && !this.isActive) {
      this.#notifySceneActivation(false);
    }
  }

  #notifySceneActivation(isActive: boolean): void {
    for (const listener of this.#sceneActivationListeners) {
      listener(isActive, this.#activationCount);
    }
  }
}

export class ProgramImp extends PropertyOwnerImp {
  readonly simulationSpeedFactorProperty = new NumberProperty(this, "simulationSpeedFactor", 1, { min: 0.0001 });
  #activeScene: SceneActivationController | null = null;

  override get program(): ProgramImp {
    return this;
  }

  get simulationSpeedFactor(): number {
    return this.simulationSpeedFactorProperty.value;
  }

  set simulationSpeedFactor(value: number) {
    this.simulationSpeedFactorProperty.setValue(value);
  }

  get activeScene(): SceneActivationController | null {
    return this.#activeScene;
  }

  setActiveScene(scene: SceneActivationController | null): void {
    if (this.#activeScene === scene) {
      return;
    }
    if (this.#activeScene) {
      this.#activeScene.deactivate();
      this.#activeScene.bindProgram(null);
    }
    this.#activeScene = scene;
    if (scene) {
      scene.bindProgram(this);
      scene.activate();
    }
  }
}
