-- Alinea los colores de las etapas del pipeline con la paleta de marca Rivexo.
-- Won/Lost se mantienen en verde/rojo por convención semántica de UX.
update pipeline_stages set color = '#AEB3EC' where name = 'Lead';
update pipeline_stages set color = '#8A92E0' where name = 'Contacto';
update pipeline_stages set color = '#3D5AE8' where name = 'Discovery';
update pipeline_stages set color = '#5E50D5' where name = 'Propuesta';
update pipeline_stages set color = '#7B45C2' where name = 'Negociación';
