const { TecnicaObra, EstadoObra, CategoriaObra, Artista, sequelize } = require('../models');

const tecnicas = [
  { nombre_tecnica: 'Óleo sobre Lienzo', descripcion: 'Pintura al óleo sobre lienzo' },
  { nombre_tecnica: 'Acrílico sobre Lienzo', descripcion: 'Pintura acrílica sobre lienzo' },
  { nombre_tecnica: 'Acuarela', descripcion: 'Pintura con acuarelas' },
  { nombre_tecnica: 'Temple', descripcion: 'Pintura al temple' },
  { nombre_tecnica: 'Carboncillo', descripcion: 'Dibujo al carboncillo' },
  { nombre_tecnica: 'Pastel', descripcion: 'Dibujo o pintura al pastel' },
  { nombre_tecnica: 'Tinta China', descripcion: 'Dibujo con tinta china' },
  { nombre_tecnica: 'Grabado', descripcion: 'Técnica de grabado en relieve o hueco' },
  { nombre_tecnica: 'Serigrafía', descripcion: 'Impresión mediante serigrafía' },
  { nombre_tecnica: 'Litografía', descripcion: 'Impresión litográfica' },
  { nombre_tecnica: 'Escultura en Bronce', descripcion: 'Fundición en bronce' },
  { nombre_tecnica: 'Escultura en Mármol', descripcion: 'Talla en mármol' },
  { nombre_tecnica: 'Escultura en Madera', descripcion: 'Talla en madera' },
  { nombre_tecnica: 'Cerámica', descripcion: 'Modelado y cocción en cerámica' },
  { nombre_tecnica: 'Fotografía Digital', descripcion: 'Fotografía en formato digital' },
  { nombre_tecnica: 'Fotografía Analógica', descripcion: 'Fotografía en película' },
  { nombre_tecnica: 'Arte Digital', descripcion: 'Creación digital o ilustración vectorial' },
  { nombre_tecnica: 'Collage', descripcion: 'Composición con materiales diversos' },
  { nombre_tecnica: 'Mixta', descripcion: 'Combinación de diversas técnicas' },
  { nombre_tecnica: 'Instalación', descripcion: 'Obra tridimensional site-specific' },
];

const estados = [
  { nombre_estado: 'Excelente', descripcion: 'Obra en perfecto estado, sin daños visibles' },
  { nombre_estado: 'Bueno', descripcion: 'Obra en buen estado, con desgaste menor' },
  { nombre_estado: 'Regular', descripcion: 'Obra con daños visibles que requieren intervención' },
  { nombre_estado: 'En Restauración', descripcion: 'Obra actualmente en proceso de restauración' },
  { nombre_estado: 'Deteriorado', descripcion: 'Obra con daños significativos' },
];

const categorias = [
  { nombre_categoria: 'Pintura', descripcion: 'Obra pictórica en cualquier soporte' },
  { nombre_categoria: 'Escultura', descripcion: 'Obra tridimensional' },
  { nombre_categoria: 'Dibujo', descripcion: 'Obra gráfica sobre papel u otro soporte' },
  { nombre_categoria: 'Grabado', descripcion: 'Estampa o impresión artística' },
  { nombre_categoria: 'Fotografía', descripcion: 'Imagen fotográfica' },
  { nombre_categoria: 'Arte Digital', descripcion: 'Obra creada con medios digitales' },
  { nombre_categoria: 'Cerámica', descripcion: 'Pieza de cerámica artística' },
  { nombre_categoria: 'Textil', descripcion: 'Obra en material textil' },
  { nombre_categoria: 'Instalación', descripcion: 'Obra site-specific o instalación' },
  { nombre_categoria: 'Arte Objeto', descripcion: 'Objeto artístico o ready-made' },
];

const artistas = [
  { nombres: 'Armando', apellidos: 'Barrios', ci: 'V-12345678', nacionalidad: 'Venezolana' },
  { nombres: 'María', apellidos: 'Rivas', ci: 'V-23456789', nacionalidad: 'Venezolana' },
  { nombres: 'Carlos', apellidos: 'Oropeza', ci: 'V-34567890', nacionalidad: 'Venezolana' },
  { nombres: 'Ana', apellidos: 'Martínez', ci: 'V-45678901', nacionalidad: 'Venezolana' },
  { nombres: 'Pedro', apellidos: 'Castillo', ci: 'V-56789012', nacionalidad: 'Venezolana' },
  { nombres: 'Sofía', apellidos: 'Linares', ci: 'V-67890123', nacionalidad: 'Venezolana' },
  { nombres: 'Jorge', apellidos: 'Salazar', ci: 'V-78901234', nacionalidad: 'Venezolana' },
  { nombres: 'Laura', apellidos: 'Cedeño', ci: 'V-89012345', nacionalidad: 'Venezolana' },
  { nombres: 'Ricardo', apellidos: 'Brito', ci: 'V-90123456', nacionalidad: 'Venezolana' },
  { nombres: 'Elena', apellidos: 'Guerrero', ci: 'V-01234567', nacionalidad: 'Venezolana' },
];

async function seedCatalogos() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos\n');

    // Técnicas
    console.log('--- Técnicas ---');
    for (const t of tecnicas) {
      const [obj, created] = await TecnicaObra.findOrCreate({
        where: { nombre_tecnica: t.nombre_tecnica },
        defaults: t,
      });
      console.log(
        `  ${created ? '✅ Creada' : 'ℹ️  Ya existe'}: ${t.nombre_tecnica} (id=${obj.id_tecnica})`
      );
    }

    // Estados
    console.log('\n--- Estados de Conservación ---');
    for (const e of estados) {
      const [obj, created] = await EstadoObra.findOrCreate({
        where: { nombre_estado: e.nombre_estado },
        defaults: e,
      });
      console.log(
        `  ${created ? '✅ Creado' : 'ℹ️  Ya existe'}: ${e.nombre_estado} (id=${obj.id_estado})`
      );
    }

    // Categorías
    console.log('\n--- Categorías ---');
    for (const c of categorias) {
      const [obj, created] = await CategoriaObra.findOrCreate({
        where: { nombre_categoria: c.nombre_categoria },
        defaults: c,
      });
      console.log(
        `  ${created ? '✅ Creada' : 'ℹ️  Ya existe'}: ${c.nombre_categoria} (id=${obj.id_categoria_obra})`
      );
    }

    // Artistas
    console.log('\n--- Artistas ---');
    for (const a of artistas) {
      const [obj, created] = await Artista.findOrCreate({
        where: { ci: a.ci },
        defaults: a,
      });
      console.log(
        `  ${created ? '✅ Creado' : 'ℹ️  Ya existe'}: ${a.nombres} ${a.apellidos} (id=${obj.id_artista})`
      );
    }

    console.log('\n🚀 Seed de catálogos completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedCatalogos();
