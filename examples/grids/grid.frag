// ----------------------------------------------------------------------------
// Copyright (c) 2014, Nicolas P. Rougier. All Rights Reserved.
// Distributed under the (new) BSD License.
// ----------------------------------------------------------------------------


// Line antialias area (usually 1 pixel)
uniform float u_antialias;

// Quad size
uniform vec2 a_size;

// Linear limits
uniform vec4 u_limits1;

// Spheric limits
uniform vec4 u_limits2;

// Major grid line width (1.50 pixel)
uniform float u_major_grid_width;

// Minor grid line width (0.75 pixel)
uniform float u_minor_grid_width;

// Major grid line color
uniform vec4 u_major_grid_color;

// Minor grid line color
uniform vec4 u_minor_grid_color;

// Texture holding normalized grid position
uniform sampler2D u_grid;

// Texture coordinates (from (-1,-1) to (+1,+1)
varying vec2 v_texcoord;

//
uniform sampler2D u_texture;


// Forward transform
vec2 transform_forward(vec2);

// Inverse transform
vec2 transform_inverse(vec2);


// [0,1]x[0,1] -> [xmin,xmax]x[ymin,ymax]
vec2 scale_forward(vec2 P, vec4 limits)
{
    // limits = xmin,xmax,ymin,ymax
    P *= vec2(limits[1] - limits[0], limits[3]-limits[2]);
    P += vec2(limits[0], limits[2]);
    return P;
}

// [xmin,xmax]x[ymin,ymax] -> [0,1]x[0,1]
vec2 scale_inverse(vec2 P, vec4 limits)
{
    // limits = xmin,xmax,ymin,ymax
    P -= vec2(limits[0], limits[2]);
    P /= vec2(limits[1]-limits[0], limits[3]-limits[2]);
    return P;
}

float stroke_alpha(float distance, float linewidth, float antialias)
{
    float t = linewidth/2.0 - antialias;
    float signed_distance = distance;
    float border_distance = abs(signed_distance) - t;
    float alpha = border_distance/antialias;
    alpha = exp(-alpha*alpha);

    if( border_distance > (linewidth/2.0 + antialias) )
        return 0.0;
    else if( border_distance < 0.0 )
        return 1.0;
    else
        return alpha;
}


void main()
{
    vec2 NP1 = v_texcoord;
    vec2 P1 = scale_forward(NP1, u_limits1);
    vec2 P2 = transform_inverse(P1);

    if( P2.x < u_limits2[0] ) discard;
    if( P2.x > u_limits2[1] ) discard;
    if( P2.y < u_limits2[2] ) discard;
    if( P2.y > u_limits2[3] ) discard;

    vec2 NP2 = scale_inverse(P2,u_limits2);

    vec4 Tx = texture2D(u_grid, vec2(NP2.x, 0.5));
    vec4 Ty = texture2D(u_grid, vec2(NP2.y, 0.5));

    vec2 P = transform_forward(vec2(Tx.x,P2.y));
    P = scale_inverse(P, u_limits1);
    float Mx = length(a_size * (NP1 - P));

    P = transform_forward(vec2(Tx.y,P2.y));
    P = scale_inverse(P, u_limits1);
    float mx = length(a_size * (NP1 - P));

    P = transform_forward(vec2(P2.x,Ty.z));
    P = scale_inverse(P, u_limits1);
    float My = length(a_size * (NP1 - P));

    P = transform_forward(vec2(P2.x,Ty.w));
    P = scale_inverse(P, u_limits1);
    float my = length(a_size * (NP1 - P));

    float M = min(Mx,My);
    float m = min(mx,my);

    vec4 color = u_major_grid_color;
    float alpha1 = stroke_alpha( M, u_major_grid_width, u_antialias);
    float alpha2 = stroke_alpha( m, u_minor_grid_width, u_antialias);
    float alpha  = alpha1;
    if( alpha2 > alpha1*1.5 )
    {
        alpha = alpha2;
        color = u_minor_grid_color;
    }
    vec4 texcolor = texture2D(u_texture, vec2(NP2.x, 1.0-NP2.y));
    gl_FragColor = mix(texcolor, color, alpha);
    // gl_FragColor = vec4(color.rgb, color.a*alpha);
}