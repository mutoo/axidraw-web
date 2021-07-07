# the svg path data BNF
# https://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
svg_path -> wsp:* moveto_drawto_command_groups:? wsp:*
moveto_drawto_command_groups -> moveto_drawto_command_group | moveto_drawto_command_group wsp:* moveto_drawto_command_groups
moveto_drawto_command_group -> moveto wsp:* drawto_commands:?
drawto_commands -> drawto_command | drawto_command wsp:* drawto_commands
drawto_command ->
    closepath
    | lineto
    | horizontal_lineto
    | vertical_lineto
    | curveto
    | smooth_curveto
    | quadratic_bezier_curveto
    | smooth_quadratic_bezier_curveto
    | elliptical_arc
moveto -> ( "M" | "m" ) wsp:* moveto_argument_sequence
moveto_argument_sequence -> coordinate_pair | coordinate_pair comma_wsp:? lineto_argument_sequence
closepath -> ("Z" | "z")
lineto -> ( "L" | "l" ) wsp:* lineto_argument_sequence
lineto_argument_sequence -> coordinate_pair | coordinate_pair comma_wsp:? lineto_argument_sequence
horizontal_lineto -> ( "H" | "h" ) wsp:* horizontal_lineto_argument_sequence
horizontal_lineto_argument_sequence -> coordinate | coordinate comma_wsp:? horizontal_lineto_argument_sequence
vertical_lineto -> ( "V" | "v" ) wsp:* vertical_lineto_argument_sequence
vertical_lineto_argument_sequence -> coordinate | coordinate comma_wsp:? vertical_lineto_argument_sequence
curveto -> ( "C" | "c" ) wsp:* curveto_argument_sequence
curveto_argument_sequence -> curveto_argument | curveto_argument comma_wsp:? curveto_argument_sequence
curveto_argument -> coordinate_pair comma_wsp:? coordinate_pair comma_wsp:? coordinate_pair
smooth_curveto -> ( "S" | "s" ) wsp:* smooth_curveto_argument_sequence
smooth_curveto_argument_sequence -> smooth_curveto_argument | smooth_curveto_argument comma_wsp:? smooth_curveto_argument_sequence
smooth_curveto_argument -> coordinate_pair comma_wsp:? coordinate_pair
quadratic_bezier_curveto -> ( "Q" | "q" ) wsp:* quadratic_bezier_curveto_argument_sequence
quadratic_bezier_curveto_argument_sequence -> quadratic_bezier_curveto_argument | quadratic_bezier_curveto_argument comma_wsp:? quadratic_bezier_curveto_argument_sequence
quadratic_bezier_curveto_argument -> coordinate_pair comma_wsp:? coordinate_pair
smooth_quadratic_bezier_curveto -> ( "T" | "t" ) wsp:* smooth_quadratic_bezier_curveto_argument_sequence
smooth_quadratic_bezier_curveto_argument_sequence -> coordinate_pair | coordinate_pair comma_wsp:? smooth_quadratic_bezier_curveto_argument_sequence
elliptical_arc -> ( "A" | "a" ) wsp:* elliptical_arc_argument_sequence
elliptical_arc_argument_sequence -> elliptical_arc_argument | elliptical_arc_argument comma_wsp:? elliptical_arc_argument_sequence
elliptical_arc_argument -> non_negative_number comma_wsp:? non_negative_number comma_wsp:? number comma_wsp flag comma_wsp:? flag comma_wsp:? coordinate_pair
coordinate_pair ->  coordinate comma_wsp:? coordinate
coordinate -> number {% id %}
non_negative_number -> integer_constant | floating_point_constant
number -> sign:? integer_constant | sign:? floating_point_constant
flag -> "0" | "1" {% id %}
comma_wsp -> (wsp:+ comma:? wsp:*) | (comma wsp:*)
comma -> ","
integer_constant -> digit_sequence
floating_point_constant -> fractional_constant exponent:? | digit_sequence exponent
fractional_constant -> digit_sequence:? "." digit_sequence | digit_sequence "."
exponent -> ( "e" | "E") sign:? digit_sequence
sign -> [+-]
digit_sequence -> digit | digit digit_sequence
digit -> [0123456789]
wsp -> [\r\n\t ]