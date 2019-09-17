#version 100


precision highp float;


uniform sampler2D uColorTexture;


varying vec4 vColor;
varying vec2 vTexcoord;



void main() {
    gl_FragColor = vColor * texture2D(uColorTexture, vTexcoord);
}
