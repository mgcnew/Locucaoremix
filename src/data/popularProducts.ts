export interface SuggestedItem {
  name: string;
  category: 'acougue' | 'mercearia' | 'bebidas' | 'churrasco' | 'limpeza';
  unit: string;
  defaultPrice: string;
  defaultPromo: string;
}

export const SUGGESTED_PRODUCTS: SuggestedItem[] = [
  // Açougue
  { name: 'Picanha Bovina Maturada', category: 'acougue', unit: 'kg', defaultPrice: '69.90', defaultPromo: '49.90' },
  { name: 'Alcatra com Maminha', category: 'acougue', unit: 'kg', defaultPrice: '44.90', defaultPromo: '34.90' },
  { name: 'Contrafilé Bovino Grill', category: 'acougue', unit: 'kg', defaultPrice: '48.90', defaultPromo: '36.90' },
  { name: 'Costela Bovina Gaúcha', category: 'acougue', unit: 'kg', defaultPrice: '29.90', defaultPromo: '19.90' },
  { name: 'Fraldinha Especial', category: 'acougue', unit: 'kg', defaultPrice: '42.90', defaultPromo: '32.90' },
  { name: 'Acém Bovino Moído na Hora', category: 'acougue', unit: 'kg', defaultPrice: '32.90', defaultPromo: '22.90' },
  { name: 'Coxão Mole Bovino de 1ª', category: 'acougue', unit: 'kg', defaultPrice: '39.90', defaultPromo: '29.90' },
  { name: 'Linguiça Toscana Perdigão', category: 'acougue', unit: 'kg', defaultPrice: '26.90', defaultPromo: '18.90' },
  { name: 'Bisteca Suína Fresca', category: 'acougue', unit: 'kg', defaultPrice: '21.90', defaultPromo: '13.90' },
  { name: 'Filé de Peito de Frango Sadia', category: 'acougue', unit: 'kg', defaultPrice: '23.90', defaultPromo: '16.90' },
  { name: 'Coxa e Sobrecoxa de Frango', category: 'acougue', unit: 'kg', defaultPrice: '14.90', defaultPromo: '9.90' },
  { name: 'Cupim Bovino Fatiado', category: 'acougue', unit: 'kg', defaultPrice: '46.90', defaultPromo: '35.90' },

  // Churrasco e Bebidas
  { name: 'Carvão Vegetal 3kg', category: 'churrasco', unit: 'pacote', defaultPrice: '18.90', defaultPromo: '13.90' },
  { name: 'Cerveja Puro Malte Lata 350ml', category: 'bebidas', unit: 'un', defaultPrice: '4.89', defaultPromo: '3.49' },
  { name: 'Refrigerante Coca-Cola 2L', category: 'bebidas', unit: 'un', defaultPrice: '11.50', defaultPromo: '8.49' },
  { name: 'Pão de Alho Recheado 400g', category: 'churrasco', unit: 'pacote', defaultPrice: '16.90', defaultPromo: '11.90' },

  // Supermercado & Despensa
  { name: 'Arroz Branco Tipo 1 5kg', category: 'mercearia', unit: 'pacote', defaultPrice: '32.90', defaultPromo: '24.90' },
  { name: 'Feijão Carioca 1kg', category: 'mercearia', unit: 'pacote', defaultPrice: '8.90', defaultPromo: '5.99' },
  { name: 'Óleo de Soja 900ml', category: 'mercearia', unit: 'un', defaultPrice: '7.99', defaultPromo: '5.49' },
  { name: 'Café Torrado e Moído 500g', category: 'mercearia', unit: 'pacote', defaultPrice: '22.90', defaultPromo: '16.90' },
  { name: 'Leite Longa Vida Integral 1L', category: 'mercearia', unit: 'un', defaultPrice: '5.89', defaultPromo: '4.29' },
  { name: 'Açúcar Refinado 1kg', category: 'mercearia', unit: 'pacote', defaultPrice: '5.49', defaultPromo: '3.99' },

  // Limpeza
  { name: 'Sabão em Pó OMO 1.6kg', category: 'limpeza', unit: 'un', defaultPrice: '25.90', defaultPromo: '17.90' },
  { name: 'Detergente Líquido 500ml', category: 'limpeza', unit: 'un', defaultPrice: '3.29', defaultPromo: '1.99' },
];
