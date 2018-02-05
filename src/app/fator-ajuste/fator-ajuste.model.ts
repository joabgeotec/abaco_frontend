import { BaseEntity } from '../shared';

export enum TipoFatorAjuste {
  'PERCENTUAL' = 'PERCENTUAL',
  'UNITARIO' = 'UNITARIO'
}
export enum ImpactoFatorAjuste {
  'INCLUSAO' = 'INCLUSAO',
  'ALTERACAO' = 'ALTERACAO',
  'EXCLUSAO' = 'EXCLUSAO',
  'CONVERSAO' = 'CONVERSAO',
  'ITENS_NAO_MENSURAVEIS' = 'ITENS_NAK_MENSURAVEIS'
}

export class FatorAjuste implements BaseEntity {

  constructor(
    public id?: number,
    public nome?: string,
    public fator?: number,
    public ativo?: boolean,
    public descricao?: string,
    public codigo?: string,
    public tipoAjuste?: TipoFatorAjuste,
    public impacto?: ImpactoFatorAjuste,
    public manual?: BaseEntity,
    public origem?: string,
    public artificialId?: number
  ) { }

  toJSONState(): FatorAjuste {
    const copy: FatorAjuste = Object.assign({}, this);
    return copy;
  }

  copyFromJSON(json: any) {
    // TODO converter manual?
    return new FatorAjuste(json.id, json.nome, json.fator, json.ativo,
      json.descricao, json.codigo, json.tipoAjuste, json.impacto, json.manual,
      json.origem, json.artificialId);
  }

  // TODO extrair modulo? entrar pro jsonable?
  clone(): FatorAjuste {
    return new FatorAjuste(this.id, this.nome, this.fator, this.ativo,
      this.descricao, this.codigo, this.tipoAjuste, this.impacto, this.manual,
      this.origem, this.artificialId);
  }

  fatorVisualizavel(): number {
    if (this.isPercentual()) {
      return this.fator * 100;
    }
    return this.fator;
  }

  isPercentual(): boolean {
    return this.tipoAjuste === TipoFatorAjuste.PERCENTUAL;
  }

  isUnitario(): boolean {
    return this.tipoAjuste === TipoFatorAjuste.UNITARIO;
  }


}
