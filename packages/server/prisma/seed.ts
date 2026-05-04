import { PrismaClient, Genero, NivelHabilidad, TipoHabilidad, ModalidadOferta, TipoContrato, EstadoPostulacion } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('--- Limpiando base de datos para reinicio total ---');
  await prisma.auditLog.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.contratacion.deleteMany();
  await prisma.historialEstadoPostulacion.deleteMany();
  await prisma.postulacion.deleteMany();
  await prisma.ofertaHabilidad.deleteMany();
  await prisma.ofertaLaboral.deleteMany();
  await prisma.egresadoHabilidad.deleteMany();
  await prisma.experienciaLaboral.deleteMany();
  await prisma.formacionAcademica.deleteMany();
  await prisma.egresado.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.rol.deleteMany();
  await prisma.carrera.deleteMany();
  await prisma.facultad.deleteMany();
  await prisma.habilidad.deleteMany();
  
  console.log('--- Iniciando Seed Súper-Exhaustivo ---');

  // 1. Catálogos (Roles, Facultades, Carreras, Habilidades)
  const roles = await Promise.all([
    prisma.rol.create({ data: { nombre: 'ADMIN' } }),
    prisma.rol.create({ data: { nombre: 'EGRESADO' } }),
    prisma.rol.create({ data: { nombre: 'EMPRESA' } }),
  ]);
  const r_egresado = roles.find(r => r.nombre === 'EGRESADO')!.id;
  const r_empresa = roles.find(r => r.nombre === 'EMPRESA')!.id;
  const r_admin = roles.find(r => r.nombre === 'ADMIN')!.id;

  const f_ing = await prisma.facultad.create({ data: { nombre: 'Facultad de Ingeniería', codigo: 'FI' } });
  const f_eco = await prisma.facultad.create({ data: { nombre: 'Ciencias Económicas', codigo: 'FCE' } });
  
  const c_sis = await prisma.carrera.create({ data: { nombre: 'Ingeniería de Sistemas', codigo: 'IS', facultad_id: f_ing.id } });
  const c_ind = await prisma.carrera.create({ data: { nombre: 'Ingeniería Industrial', codigo: 'II', facultad_id: f_ing.id } });
  const c_adm = await prisma.carrera.create({ data: { nombre: 'Administración', codigo: 'ADM', facultad_id: f_eco.id } });

  const skills = await Promise.all([
    prisma.habilidad.create({ data: { nombre: 'TypeScript', tipo: TipoHabilidad.TECNICA, categoria: 'Programación' } }),
    prisma.habilidad.create({ data: { nombre: 'React', tipo: TipoHabilidad.TECNICA, categoria: 'Frontend' } }),
    prisma.habilidad.create({ data: { nombre: 'Node.js', tipo: TipoHabilidad.TECNICA, categoria: 'Backend' } }),
    prisma.habilidad.create({ data: { nombre: 'SQL Server', tipo: TipoHabilidad.TECNICA, categoria: 'DB' } }),
    prisma.habilidad.create({ data: { nombre: 'Liderazgo', tipo: TipoHabilidad.BLANDA, categoria: 'Soft' } }),
    prisma.habilidad.create({ data: { nombre: 'Comunicación', tipo: TipoHabilidad.BLANDA, categoria: 'Soft' } }),
  ]);

  // 2. Usuarios ADMIN
  await prisma.usuario.create({ data: { email: 'admin@sistema.com', password_hash: passwordHash, rol_id: r_admin } });

  // 3. Empresas (10 Empresas con datos reales)
  const nombresEmpresas = [
    'Bancolombia', 'Globant', 'Mercado Libre', 'Rappi', 'Sura', 
    'Ecopetrol', 'Nutresa', 'Exito', 'Claro', 'Tigo'
  ];
  const empresas = [];
  for (const nombre of nombresEmpresas) {
    const u = await prisma.usuario.create({
      data: {
        email: `${nombre.toLowerCase().replace(/ /g, '')}@empresa.com`,
        password_hash: passwordHash,
        rol_id: r_empresa,
        empresa: {
          create: {
            nombre,
            nit: `900${Math.floor(Math.random() * 900000)}`,
            sector: nombre === 'Globant' || nombre === 'Rappi' ? 'Tecnología' : 'Servicios',
            ciudad: 'Bogotá',
            verificada: true,
            descripcion: `Líder en el mercado de ${nombre}.`
          }
        }
      },
      include: { empresa: true }
    });
    empresas.push(u.empresa!);
  }

  // 4. Egresados (10 Egresados con perfiles densos)
  const nombresEgresados = ['Carlos', 'Ana', 'Luis', 'Sofía', 'Mateo', 'Elena', 'Diego', 'Lucía', 'Jorge', 'Marta'];
  const egresados = [];
  for (const nombre of nombresEgresados) {
    const u = await prisma.usuario.create({
      data: {
        email: `${nombre.toLowerCase()}@test.com`,
        password_hash: passwordHash,
        rol_id: r_egresado,
        egresado: {
          create: {
            nombres: nombre,
            apellidos: 'Test G.',
            telefono: '3000000000',
            genero: nombre === 'Ana' || nombre === 'Sofía' ? Genero.F : Genero.M,
            biografia: `Egresado de ${c_sis.nombre} con metas altas.`,
            buscando_empleo: true,
            formacion_academica: {
              create: {
                institucion: 'U. Nacional',
                titulo: 'Profesional',
                carrera_id: nombre === 'Carlos' || nombre === 'Mateo' ? c_sis.id : c_ind.id,
                fecha_inicio: new Date('2018-01-01'),
                fecha_fin: new Date('2023-01-01'),
                culminada: true
              }
            },
            experiencia_laboral: {
              create: {
                empresa: 'Empresa Pasante',
                cargo: 'Practicante',
                fecha_inicio: new Date('2022-01-01'),
                fecha_fin: new Date('2022-12-01')
              }
            },
            habilidades: {
              create: [
                { habilidad_id: skills[0].id, nivel: NivelHabilidad.AVANZADO },
                { habilidad_id: skills[4].id, nivel: NivelHabilidad.INTERMEDIO }
              ]
            }
          }
        }
      },
      include: { egresado: true }
    });
    egresados.push(u.egresado!);
  }

  // 5. Ofertas Laborales (15 Ofertas distribuidas)
  const ofertas = [];
  for (let i = 0; i < 15; i++) {
    const empresa = empresas[i % empresas.length];
    const o = await prisma.ofertaLaboral.create({
      data: {
        empresa_id: empresa.id,
        titulo: `Vacante ${i + 1}: Especialista en ${i % 2 === 0 ? 'Sistemas' : 'Procesos'}`,
        descripcion: 'Únete a nuestro equipo multidisciplinario.',
        salario_min: 4000000 + (i * 100000),
        salario_max: 6000000 + (i * 100000),
        modalidad: i % 3 === 0 ? ModalidadOferta.REMOTO : ModalidadOferta.PRESENCIAL,
        estado: 'activa',
        habilidades: {
          create: { habilidad_id: skills[i % skills.length].id, obligatoria: true }
        }
      }
    });
    ofertas.push(o);
  }

  // 6. Postulaciones y Relaciones Cruzadas (Asegurar que TODOS tengan datos)
  console.log('6. Generando Postulaciones Cruzadas...');
  for (const eg of egresados) {
    // Cada egresado se postula a por lo menos 3 ofertas
    const indices = [(egresados.indexOf(eg)) % ofertas.length, (egresados.indexOf(eg) + 1) % ofertas.length, (egresados.indexOf(eg) + 2) % ofertas.length];
    
    for (const idx of indices) {
      const o = ofertas[idx];
      const estado = idx % 4 === 0 ? EstadoPostulacion.CONTRATADO : idx % 3 === 0 ? EstadoPostulacion.ENTREVISTA : EstadoPostulacion.POSTULADO;
      
      await prisma.postulacion.create({
        data: {
          egresado_id: eg.id,
          oferta_id: o.id,
          estado,
          historial_estados: { create: { estado_nuevo: estado } }
        }
      });

      if (estado === EstadoPostulacion.CONTRATADO) {
        await prisma.contratacion.create({
          data: { egresado_id: eg.id, empresa_id: o.empresa_id, oferta_id: o.id }
        });
      }
    }
  }

  console.log('--- Seed Súper-Exhaustivo Completado ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
