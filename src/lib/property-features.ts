export const featureGroups = [
  { title: 'Ambientes', items: ['Cozinha', 'Sala', 'Sala de TV', 'Despensa', 'Lavabo', 'Varanda / sacada', 'Lavanderia', 'Closet', 'Escritório'] },
  { title: 'Lazer e comodidades', items: ['Piscina', 'Elevador', 'Churrasqueira', 'Área gourmet', 'Jardim', 'Ar-condicionado', 'Mobiliado', 'Wi-Fi'] },
  { title: 'Energia, aquecimento e segurança', items: ['Energia elétrica', 'Energia solar', 'Aquecimento a gás', 'Aquecimento elétrico', 'Alarme', 'Portaria', 'Câmeras de segurança'] },
];
export const featureOptions = featureGroups.flatMap((group) => group.items);