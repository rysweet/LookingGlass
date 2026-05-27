import {
  AxesImp,
  BillboardImp,
  BoxImp,
  ConeImp,
  CylinderImp,
  DiscImp,
  SphereImp,
  TextModelImp,
  TorusImp,
} from "./expanded-implementation";
import { SModel } from "./expanded-entities-base-models";

const nonEmptyString = (value: string): boolean => typeof value === "string" && value.trim().length > 0;

export abstract class SShape extends SModel {}
export class SBox extends SShape { constructor() { super((owner) => new BoxImp(owner)); } }
export class SSphere extends SShape { constructor() { super((owner) => new SphereImp(owner)); } protected get sphereImp(): SphereImp { return this.imp as SphereImp; } get radius(): number { return this.sphereImp.radius.value; } set radius(value: number) { this.sphereImp.radius.value = value; } }
export class SDisc extends SShape { constructor() { super((owner) => new DiscImp(owner)); } protected get discImp(): DiscImp { return this.imp as DiscImp; } get radius(): number { return this.discImp.outerRadius.value; } set radius(value: number) { this.discImp.outerRadius.value = value; } }
export class SCone extends SShape { constructor() { super((owner) => new ConeImp(owner)); } protected get coneImp(): ConeImp { return this.imp as ConeImp; } get baseRadius(): number { return this.coneImp.baseRadius.value; } set baseRadius(value: number) { this.coneImp.baseRadius.value = value; } get length(): number { return this.coneImp.length.value; } set length(value: number) { this.coneImp.length.value = value; } }
export class SCylinder extends SShape { constructor() { super((owner) => new CylinderImp(owner)); } protected get cylinderImp(): CylinderImp { return this.imp as CylinderImp; } get radius(): number { return this.cylinderImp.radius.value; } set radius(value: number) { this.cylinderImp.radius.value = value; } get length(): number { return this.cylinderImp.length.value; } set length(value: number) { this.cylinderImp.length.value = value; } }
export class STorus extends SShape { constructor() { super((owner) => new TorusImp(owner)); } protected get torusImp(): TorusImp { return this.imp as TorusImp; } get innerRadius(): number { return this.torusImp.innerRadius.value; } set innerRadius(value: number) { this.torusImp.innerRadius.value = value; } get outerRadius(): number { return this.torusImp.outerRadius.value; } set outerRadius(value: number) { this.torusImp.outerRadius.value = value; } }
export class SAxes extends SShape { constructor() { super((owner) => new AxesImp(owner)); } }
export class SBillboard extends SModel { constructor() { super((owner) => new BillboardImp(owner)); } protected get billboardImp(): BillboardImp { return this.imp as BillboardImp; } get backPaint(): string { return this.billboardImp.backPaint.value; } set backPaint(value: string) { if (nonEmptyString(value)) { this.billboardImp.backPaint.value = value; } } }
export class STextModel extends SModel { constructor() { super((owner) => new TextModelImp(owner)); } protected get textModelImp(): TextModelImp { return this.imp as TextModelImp; } get value(): string { return this.textModelImp.value; } set value(text: string) { this.textModelImp.value = text; } append(value: unknown): void { this.textModelImp.append(value); } charAt(index: number): string { return this.textModelImp.charAt(index); } delete(start: number, end: number): void { this.textModelImp.delete(start, end); } deleteCharAt(index: number): void { this.textModelImp.deleteCharAt(index); } indexOf(value: string, fromIndex?: number): number { return this.textModelImp.indexOf(value, fromIndex); } lastIndexOf(value: string, fromIndex?: number): number { return this.textModelImp.lastIndexOf(value, fromIndex); } insert(offset: number, value: unknown): void { this.textModelImp.insert(offset, value); } get length(): number { return this.textModelImp.getLength(); } replace(start: number, end: number, value: string): void { this.textModelImp.replace(start, end, value); } setCharAt(index: number, value: string): void { this.textModelImp.setCharAt(index, value); } }
