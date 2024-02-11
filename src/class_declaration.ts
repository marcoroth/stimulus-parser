import { ImportDeclaration, ExportDeclaration, ClassDeclarationNode } from "./types"

export class ClassDeclaration {
  public readonly className?: string
  public readonly superClass?: ClassDeclaration
  public readonly node?: ClassDeclarationNode

  public isStimulusDescendant: boolean = false
  public importDeclaration?: ImportDeclaration;
  public exportDeclaration?: ExportDeclaration;

  constructor(className: string | undefined, superClass: ClassDeclaration | undefined, node?: ClassDeclarationNode | undefined) {
    this.className = className
    this.superClass = superClass
    this.isStimulusDescendant = (superClass && superClass.isStimulusDescendant) || false
    this.node = node
  }
}
