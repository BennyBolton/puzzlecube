#version 100

precision highp float;


uniform vec4 uColor;
uniform sampler2D uTexture;


varying vec2 vTexcoord;


void main() {
    gl_FragColor = uColor * texture2D(uTexture, vTexcoord);
}
