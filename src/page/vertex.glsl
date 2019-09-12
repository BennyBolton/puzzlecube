#version 100

precision highp float;


uniform mat4 uProjection;
attribute vec3 iVertex;
attribute vec2 iTexcoord;

varying vec2 vTexcoord;


void main() {
    gl_Position = uProjection * vec4(iVertex, 1.0);
    vTexcoord = iTexcoord;
}
