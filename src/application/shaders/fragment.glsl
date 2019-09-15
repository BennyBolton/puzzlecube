#version 100


precision highp float;



uniform vec4 uColor;
uniform sampler2D uColorTexture;


varying vec2 vTexcoord;
varying float vFade;



void main() {
    vec4 color = vec4(vFade, vFade, vFade, 1.0) * uColor;

    gl_FragColor = color * texture2D(uColorTexture, vTexcoord);
}
