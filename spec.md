# AppPartidos

## Objetivo:
Obtener una aplicación web donde visualizar en modo calendario los fines de semana (viernes, sábado y domingo) de cada semana, donde se puedan visualizar los partidos que se van a jugar: Deporte, horario, lugar y rival. Estarán todos los fines de semana desde el 01 de noviembre de 2026 hasta el 30 de junio de 2027, aunque al cargar se mostrará el fin de semana de la semana actual, pudiendo hacer scroll después hacia arriba o hacia abajo.

Además, existirá un enlace(endpoint) por el cual se podrá cargar información de los diferentes partidos. La app se realizará con el framework vue3, para la gestión del backend o del JSON se usara un expresJS implementando un fichero vercel.json, pues la apliacion se va a desplegar en Vercel. 


## Requisito 1:
En la página se verán ordenados en filas los diferentes fines de semana, empezando por el correspondiente a la semana actual. Se indica mes y días junto el nombre del día (viernes, sábado, domingo).

## Requisito 2:
Se cargan los diferentes partidos y aparecerán en su día de juego, ordenados por fecha de inicio. Se muestra deporte, hora de inicio, lugar y un icono si es en casa o fuera (el icono de una casa si el atributo “casa” es true, el icono de un avión si el atributo “casa” es false), y en caso de existir un resultado informado se muestra el resultado, si no no.

## Requisito 3:
Los datos se cargan de un JSON con el siguiente formato:
{partidos:[{deporte,
fecha,
horario,
lugar,
casa,
resultado}]
}

## Requisito 4:
Para dar de alta un partido, se accede mediante un endpoint, enlace, a un formulario donde se guardará la información. Este enlace no estará accesible desde la vista principal, será una url que se conozca por el administrador. En el formulario habrá campos para poner los datos:
Deporte: será un seleccionable con los datos futbol, baloncesto, waterpolo, waterpolo infantil, baile moderno.
Fecha: fecha del partido
horario: hora de inicio del partido
lugar: Nombre del sitio
casa: un checkbox para marcar
resultado: un cuadro de texto

al enviar el formulario, se guardará la información en el JSON general para la consulta.


## Requisito 5:
Solo puede haber un partido por deporte y fecha. Al guardar un partido que ya existe para esa combinación, se actualiza con la información nueva, incluida la hora, no se crea uno nuevo.

## Requisito 6:
En el formulario habrá una opción para una vez seleccionado deporte y fecha, poder borrar los partidos cargados para ese deporte en esa fecha.

## Requistio 7:
A cada partido se ha añadido un atributo nuevo: acude. Es un boolean que por defecto estará a true. Este atributo será modificable mediante el formulario de edicion o creación de partidos. A la hora de mostrar los partidos en el calendario, en caso de que el partido tenga el atributo acude a false, el partido ese se mostrara con un fondo ligeramente rojo. En caso de estar a true, se deja como hasta ahora el partido.

## Requisito 8:
La etiqueta con el titulo del deporte en la vista del calendario de debe de mostrar con un color diferente para cada deporte. la relación es la siguiente: Futbol -> verde, balocesto -> naranja, waterpolo -> azul claro, waterpolo infantil -> azul oscuro, baile moderno -> morado.