import type { BoundingBox, JointNode, Orientation, Position } from "../story-api";
import type { MaterialDefinition } from "../materials";

export interface BaseModelClassData {
  readonly abstractionClassName: string;
  readonly implementationClassName: string;
}

export interface ModelClassData extends BaseModelClassData {
  readonly resourceClassName: string;
  readonly packageName: string;
  readonly category: string;
}

export const BASE_MODEL_CLASS_DATA = {
  PROP: {
    abstractionClassName: "SJointedModel",
    implementationClassName: "BasicJointedModelImp",
  },
  BIPED: {
    abstractionClassName: "SBiped",
    implementationClassName: "BipedImp",
  },
  SWIMMER: {
    abstractionClassName: "SSwimmer",
    implementationClassName: "SwimmerImp",
  },
  FLYER: {
    abstractionClassName: "SFlyer",
    implementationClassName: "FlyerImp",
  },
  QUADRUPED: {
    abstractionClassName: "SQuadruped",
    implementationClassName: "QuadrupedImp",
  },
  VEHICLE: {
    abstractionClassName: "STransport",
    implementationClassName: "TransportImp",
  },
  SLITHERER: {
    abstractionClassName: "SSlitherer",
    implementationClassName: "SlithererImp",
  },
} satisfies Record<string, BaseModelClassData>;

export const MODEL_CLASS_DATA = {
  BIPED: {
    ...BASE_MODEL_CLASS_DATA.BIPED,
    resourceClassName: "BipedResource",
    packageName: "org.lgna.story.resources.biped",
    category: "people",
  },
  FLYER: {
    ...BASE_MODEL_CLASS_DATA.FLYER,
    resourceClassName: "FlyerResource",
    packageName: "org.lgna.story.resources.flyer",
    category: "animals",
  },
  QUADRUPED: {
    ...BASE_MODEL_CLASS_DATA.QUADRUPED,
    resourceClassName: "QuadrupedResource",
    packageName: "org.lgna.story.resources.quadruped",
    category: "animals",
  },
  SWIMMER: {
    ...BASE_MODEL_CLASS_DATA.SWIMMER,
    resourceClassName: "SwimmerResource",
    packageName: "org.lgna.story.resources.swimmer",
    category: "animals",
  },
  FISH: {
    ...BASE_MODEL_CLASS_DATA.SWIMMER,
    resourceClassName: "FishResource",
    packageName: "org.lgna.story.resources.fish",
    category: "animals",
  },
  MARINE_MAMMAL: {
    ...BASE_MODEL_CLASS_DATA.SWIMMER,
    resourceClassName: "MarineMammalResource",
    packageName: "org.lgna.story.resources.marinemammal",
    category: "animals",
  },
  PROP: {
    ...BASE_MODEL_CLASS_DATA.PROP,
    resourceClassName: "PropResource",
    packageName: "org.lgna.story.resources.prop",
    category: "props",
  },
  VEHICLE: {
    ...BASE_MODEL_CLASS_DATA.VEHICLE,
    resourceClassName: "TransportResource",
    packageName: "org.lgna.story.resources.transport",
    category: "vehicles",
  },
  AUTOMOBILE: {
    ...BASE_MODEL_CLASS_DATA.VEHICLE,
    resourceClassName: "AutomobileResource",
    packageName: "org.lgna.story.resources.automobile",
    category: "vehicles",
  },
  AIRCRAFT: {
    ...BASE_MODEL_CLASS_DATA.VEHICLE,
    resourceClassName: "AircraftResource",
    packageName: "org.lgna.story.resources.aircraft",
    category: "vehicles",
  },
  WATERCRAFT: {
    ...BASE_MODEL_CLASS_DATA.VEHICLE,
    resourceClassName: "WatercraftResource",
    packageName: "org.lgna.story.resources.watercraft",
    category: "vehicles",
  },
  TRAIN: {
    ...BASE_MODEL_CLASS_DATA.VEHICLE,
    resourceClassName: "TrainResource",
    packageName: "org.lgna.story.resources.train",
    category: "vehicles",
  },
  SLITHERER: {
    ...BASE_MODEL_CLASS_DATA.SLITHERER,
    resourceClassName: "SlithererResource",
    packageName: "org.lgna.story.resources.slitherer",
    category: "animals",
  },
} satisfies Record<string, ModelClassData>;

export type KnownModelClassKey = keyof typeof MODEL_CLASS_DATA;

export interface ModelGeometryData {
  readonly vertices: readonly number[];
  readonly indices: readonly number[];
  readonly normals?: readonly number[];
  readonly uvs?: readonly number[];
  readonly bounds?: BoundingBox | null;
}

export interface ModelJointDefinition {
  readonly name: string;
  readonly parentName: string | null;
  readonly localTransform?: {
    readonly position: Position;
    readonly orientation: Orientation;
  };
  readonly bounds?: BoundingBox | null;
}

export interface ModelClassInfo {
  readonly modelClass: ModelClassData;
  readonly joints: readonly ModelJointDefinition[];
  readonly hierarchy: readonly JointNode[];
  readonly jointArrays: Readonly<Record<string, readonly string[]>>;
  readonly boundingBox: BoundingBox | null;
}

export interface ModelClassInfoSource {
  readonly joints?: readonly ModelJointDefinition[];
  readonly boundingBox?: BoundingBox | null;
  readonly customArrayNameMap?: Readonly<Record<string, string>>;
  readonly suppressedJoints?: readonly string[];
  readonly arrayNamesToSkip?: readonly string[];
  readonly removeRootJoints?: boolean;
}

export interface ModelResourceLoadResult {
  readonly geometry?: ModelGeometryData;
  readonly materials?: readonly MaterialDefinition[];
  readonly textures?: Readonly<Record<string, Uint8Array>>;
  readonly thumbnail?: Uint8Array | null;
  readonly classInfo?: ModelClassInfoSource;
}

export interface ModelResourceDefinition {
  readonly id: string;
  readonly name: string;
  readonly modelName: string;
  readonly category: string;
  readonly modelClass: KnownModelClassKey | ModelClassData;
  readonly tags?: readonly string[];
  readonly treePath?: readonly string[];
  readonly geometry?: ModelGeometryData;
  readonly materials?: readonly MaterialDefinition[];
  readonly textures?: Readonly<Record<string, Uint8Array>>;
  readonly thumbnail?: Uint8Array | null;
  readonly classInfo?: ModelClassInfoSource;
  readonly loader?: (definition: ModelResourceSummary) => ModelResourceLoadResult | Promise<ModelResourceLoadResult>;
}

export interface ModelResourceSummary {
  readonly id: string;
  readonly name: string;
  readonly modelName: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly treePath: readonly string[];
  readonly modelClass: ModelClassData;
}

export interface LoadedModelResource extends ModelResourceSummary {
  readonly geometry: ModelGeometryData;
  readonly materials: readonly MaterialDefinition[];
  readonly textures: Readonly<Record<string, Uint8Array>>;
  readonly thumbnail: Uint8Array | null;
  readonly classInfo: ModelClassInfo;
}

export interface ModelDiscoveryOptions {
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly query?: string;
}

export interface ModelBrowserNode {
  readonly id: string;
  readonly name: string;
  readonly kind: "folder" | "model";
  readonly children: readonly ModelBrowserNode[];
  readonly resourceId?: string;
  readonly category?: string;
  readonly modelClass?: ModelClassData;
}
