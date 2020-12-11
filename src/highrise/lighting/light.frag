varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   vec4 textureColor = texture2D(uSampler, vTextureCoord);
   gl_FragColor.rgb += textureColor.rgb * gl_FragColor.a;
   gl_FragColor.a = 1.0;
}