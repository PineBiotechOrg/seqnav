import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import g4p_controls.*; 
import java.math.BigDecimal; 
import java.awt.event.ComponentAdapter; 
import java.awt.event.ComponentEvent; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class LayerCake extends PApplet {





//UI components
GLabel lBin, lConf, lDip, lEvent, lStripe, lCoverage,lData;
GCustomSlider sBin, sConf, sEvent;
GTextField tstart, tend;
GCheckbox stripeCheck;
GCheckbox synomCheck;
GCheckbox nonsynomCheck;
GCheckbox coverageCheck;
GToggleGroup optRef;


HashMap<String,Integer> names;
char[][] refgen;
HashMap codonlookup;
int[] rowcolors;
String[] metadata;
//raw data: variation %
float [][][] vraw;
double [][][] praw;
int[][] covraw;
int maxcovraw = 0;
int maxcovdisp = 0;

//display
int[][] covdisp;
float [][] vdisp;
double [][] pdisp;


float[] vhist;

//visibility

// reference : location : is this amino acid synom. with the reference?
boolean haveSynom;
boolean[][][] synom;

//orf information
int[] starts;
int[]ends;
int[] depths;
String[] orfNames;

GOption[] reference;

float bw = 10;
float bh = 200;
int rows = -1;
int cols = -1;
int rgap = 10;
int cgap = 0;

float xtrans = 0;
float ytrans = 0;
float oldx = 0;
float oldy = 0;

int maxcount = 0;
float maxn = 0;
float maxdip = 0;
float maxvariant = 0;
float maxrawvariant = 0;

int mode = 0;
float vweight = .9f;
float eweight = .80f;
int row = 0;
int col = 0;
int minrt = 999999;
int maxrt = -1;
int minminrt = 999999;
int maxmaxrt = -1;
int minwidth = 60;
float ratio = 10;
int winWidth = 0;
int winHeight = 0;
int slWidth = 0;
int slGap = 0;
PFont font;
int dataWidth;
int dataX = 130;
int binBasePairs = minwidth;
char[] atcgOrder = new char[] {
  'A', 'T', 'C', 'G'
};
int[] actgcolor = new int[] {
  color(102, 194, 165), color(141, 160, 203), color(231, 138, 195), color(166, 216, 84), color(255)
};
int zoomBin = -1;
float zoomS = 0;
float zoomW = 0;
float bpw = 0;
float oldbw = 0;
int rawcol = -1;
int minBasePairs = 1;
int prevBinMax = 0;
int prevBinVal = 0;
int maxZoomedBinSize = 0;
int numBins = 0;
int dataY = 90;
int sideGraphWidth = 200;
int[] events;

int left = color(255, 255, 204);  //yellow - 60  .167  .2   1
int left10  = color(255, 246, 176);
int left20  = color(255, 230, 148);  //         .128,.42,1
int left30  = color(252, 205, 116);
int left40 =  color(255, 176, 88);  //         .095,.84,.1
int mid =  color(253, 141, 60);  //orange -  25  .069  .76  .99
int right60 =  color(227, 92, 43);   //          .02,.57,.87
int right70 =  color(201, 51, 28);
int right80 =  color(179, 18, 21);
int right90 =  color(153, 8, 29);
int right = color(128, 0, 38);  //red    - 342  .95  1     .5


int  bottom = color(200);
int maxcolor = color(194, 0, 0);  // .95 1 .76

int[] coloroptions = new int[] {
  bottom, color(128), color(255, 127, 0), color(0, 0, 255, 128)
};

//--------Wedge vars----------------
Wedge wedge;
int tipcolor = color(243, 221, 73);
int eventcolor = color(255, 0, 0);
int wedgeX = 0;
int wedgeY = 0;
int wedgewidthonscreen = 90;
float prevValue = 0.7f;
float wedgeratio = 1;

//--------Row Interchange--------------
boolean pressed; 
int visibleCount = 0;
int selectedRow = -1;
int draggedRow = 0;
int[] reorder;

//Row reference
int refRow = -1;


boolean shouldRedraw = true;

public void setup() {

  //winWidth = int(min(5000,screen.width-250));
  //winHeight = int(min(1000,screen.height-150));

  size(1400, 1000);
  
  winWidth = width;
  winHeight = height;
  
  if(frame!=null){
    frame.setResizable(true);
  }
  

  dataWidth = (winWidth-dataX)-25 - sideGraphWidth;
  rectMode(CORNER);
  oldx = mouseX;
  oldy = mouseY;

  font = loadFont("Calibri-14.vlw");
  textFont(font, 14);
  bpw = textWidth('G'+"");
  slWidth = winWidth/3;
  slGap = slWidth*3/5;

  //G4P.globalFont = GFont.getFont(this, "Calibri", 12);
  //String fname = selectInput("Select a .tsv file...");

  /*
  String fname = selectFolder("Select a folder of .csv files...");
   //System.err.println(fname);
   if(fname==null){
   fname = dataPath("TestData");
   }//end if
   loadDir(fname);
   */
  loadTest();
  //vdisp = vraw;
  //String reffname = "./data/sivmac239_proteins.csv";



  reference = new GOption[rows+2];
  visibleCount = rows;
  codonlookup = new HashMap();

  //print ("vraw size=" + vraw[2].length);
  noStroke();
  bh = ((winHeight- 160 - dataY)/PApplet.parseFloat(rows))-rgap;      // adjust space for sliders
  bw = ((dataWidth/PApplet.parseFloat(cols))-cgap);
  oldbw = bw;
  reorder = new int[rows];
  for (int i = 0;i<reorder.length;i++) {
    reorder[i] = i;
  }
  int numBins = ceil((maxrt-minrt)/binBasePairs);
  minBasePairs = ceil((maxrt-minrt)/dataWidth);  //each bin gets atleast 1 pixel
  int maxBasePairs = floor(PApplet.parseFloat(dataWidth-rows+1)/bpw);

  //setup UI elements

  synomCheck = new GCheckbox(this, 555 +slWidth, winHeight - 120, 170, 15, "Show Synon. Var.");
  synomCheck.setSelected(true);

  nonsynomCheck = new GCheckbox(this, 555 +slWidth, winHeight - 100, 170, 15, "Show Non-Synon. Var.");
  nonsynomCheck.setSelected(true);
  stripeCheck = new GCheckbox(this, 400 +slWidth, winHeight - 120, 150, 15, "Event Striping");
  coverageCheck = new GCheckbox(this, 400 +slWidth, winHeight - 100, 150, 15, "Show Coverage");
  coverageCheck.setSelected(false);


  lConf = new GLabel(this, 240, winHeight - 65, 120, 15, "-log(Alpha)");
  lBin = new GLabel(this, 240, winHeight - 120, 120, 15, "Bin Size (bp)");  
  lEvent = new GLabel(this, 300+slWidth, winHeight - 65, 150, 15, "Event Threshold");
  sBin = new GCustomSlider(this, 345, winHeight - 135, slGap, 50, "grey_blue");
  sBin.setLimits(minwidth, minBasePairs, maxBasePairs);
  sBin.setNumberFormat(G4P.INTEGER);
  sBin.setShowValue(true);
  sBin.setShowTicks(true);
  sBin.setShowLimits(true);
  sBin.setNbrTicks(floor((maxBasePairs-minBasePairs)/5.0f));
  sConf = new GCustomSlider(this, 345, winHeight - 80, slGap, 50, "grey_blue");
  sConf.setNumberFormat(G4P.INTEGER);
  sConf.setLimits( 1, 1, 70);
  sConf.setShowValue(true);
  sConf.setShowTicks(true);
  sConf.setShowLimits(true);
  sConf.setNbrTicks(35);
  sEvent = new GCustomSlider(this, 430+slWidth, winHeight - 80, slGap, 50, "grey_blue");
  sEvent.setLimits(.9f, 0, 1.0f );
  sEvent.setNumberFormat(G4P.DECIMAL);
  sEvent.setShowValue(true);
  sEvent.setShowTicks(true);
  sEvent.setShowLimits(true);
  sEvent.setNbrTicks(20);


  lData = new GLabel(this, 700 +slWidth, winHeight - 140, 120, 12, "Data Limits");
  tstart = new GTextField(this, 700 +slWidth, winHeight - 120, 50, 15);
  tstart.setText(str(minrt));
  tend = new GTextField(this, 760 +slWidth, winHeight - 120, 50, 15);
  tend.setText(str(maxrt));

  optRef = new GToggleGroup();


  bw = (dataWidth/PApplet.parseFloat(numBins))-cgap;
  if (bw>=1) {
    sample(binBasePairs);
  }
  else {
    sample(minBasePairs);
    bw = 1;
    //println(bw + "--" + minBasePairs);
  }
  oldbw = bw;
  prevBinMax = 160;
  prevBinVal = minwidth;

  //WEDGE IN HERE ***************************          WEDGE      ********************************
  wedgewidthonscreen = 80;
  wedgeX = 30 +   wedgewidthonscreen;
  wedgeY = winHeight-5;
  wedge = new Wedge(wedgeX, wedgeY, 270);
  wedge.right = vweight;
  wedge.left=0;
  setupcodontable();
  //calcReferenceGenome();
  //loadProteinOverlay();


  reference[0] = new GOption(this, 0, 40, 200, 25, "Individual References");
  optRef.addControl(reference[0]);

  
  reference[1] = new GOption(this, 0, 60, 200, 25, "Population Consensus");
  optRef.addControl(reference[1]);
  reference[0].setSelected(true);
  for (int i = 0;i<vdisp.length;i++) {
    reference[i+2] = new GOption(this, 5, PApplet.parseInt(dataY+ (i*(bh+rgap))) , 25, bh);
    optRef.addControl(reference[i+2]);
  }
}//end setup

//-------------------------------------------------------------------
////////////////////// DRAW FUNCTIONS START HERE ////////////////////
//-----------------------------------------------------------------
public void draw() {
  if(winWidth!=width || winHeight!=height){
          winWidth = width;
          winHeight = height;
        shouldRedraw = true;
          dataWidth = (winWidth-dataX)-25 - sideGraphWidth;
          slWidth = winWidth/3;
          slGap = slWidth*3/5;
          bh = ((winHeight- 160 - dataY)/PApplet.parseFloat(rows))-rgap;  
          bw = ((dataWidth/PApplet.parseFloat(cols))-cgap);
          oldbw = bw;
          wedgeX = 30 +   wedgewidthonscreen;
          wedgeY = winHeight-5;
          wedge.setWedgeX(wedgeX);
          wedge.setWedgeY(wedgeY);
          
          for(int i = 0;i<vdisp.length;i++){
            reference[i+2].moveTo(5,(dataY+ (i)*(bh+rgap)) + (bh-reference[i+2].getHeight()));
          }
          
          synomCheck.moveTo(555 +slWidth, winHeight - 120);
          nonsynomCheck.moveTo(555 +slWidth, winHeight - 100);
          stripeCheck.moveTo(400 +slWidth, winHeight - 120);
          coverageCheck.moveTo( 400 +slWidth, winHeight - 100);
          lConf.moveTo(240, winHeight - 65);
          lBin.moveTo(240, winHeight - 120);
          lEvent.moveTo(300+slWidth, winHeight - 65);
          sBin.moveTo(345, winHeight - 135);
          sConf.moveTo(345, winHeight - 80);
          sEvent.moveTo(430+slWidth, winHeight - 80);
          
          lData.moveTo(700 +slWidth, winHeight - 140);
          tstart.moveTo(700 +slWidth, winHeight - 120);
          tend.moveTo(760 +slWidth, winHeight - 120);
         // System.err.println("Resized!");
         // startx = winWidth-sideGraphWidth+5;

  }
  
  if (shouldRedraw) {
    if (mode==0) {
      drawEven(false);
    }//end if
    else if (mode==2) {
      drawEven(true);
    }//end if

    if (zoomBin>=0) {
      if (mouseX< winWidth - 2*wedgewidthonscreen) {
        if ((mouseX-xtrans-dataX)<=zoomS) {
          col = floor( (mouseX-xtrans-dataX)/(bw+cgap));
        }
        else if ((mouseX-xtrans-dataX)>=zoomS+zoomW) {
          col =  floor( (mouseX-xtrans-dataX-zoomS-zoomW)/ (bw+cgap)) + (zoomBin+1);
        }
        if ((mouseX-xtrans-dataX)>zoomS && (mouseX-xtrans-dataX)<zoomS+zoomW) {
          rawcol = (zoomBin*binBasePairs) +  floor( (mouseX-xtrans-dataX-zoomS)/ (bpw+cgap)) + (minrt-minminrt);
        }
      }
    }//end if
    else {
      col = floor( (mouseX-xtrans-dataX)/(bw+cgap));
    }
    row = floor((mouseY-ytrans-dataY)/(bh+rgap));
    if (row>=0 && row<reorder.length) {
      row = reorder[row];
    }

    //MORE WEDGES ---------------------
    wedge.draw();
    if (zoomBin!=-1) {
      text("100%", wedgeX + 100, wedgeY - 125);
      text( toPercentFloat(wedge.right), wedge.posX(wedge.right, 1.0f), wedge.posY(wedge.right, 1.0f)-5);
    }
    else {
      text( toPercentFloat(maxvariant), wedgeX + 100, wedgeY-125);
      text( toPercentFloat(maxvariant*wedge.right), wedge.posX(wedge.right, 1.0f), wedge.posY(wedge.right, 1.0f)-5);
    }
    text( toPercentFloat(maxvariant*wedge.left), wedge.posX(wedge.left, 1.0f)-textWidth(toPercentFloat(maxvariant*wedge.left)), wedge.posY(wedge.left, 1.0f)-5);
    text("100%", wedgeX + 90, wedgeY - 90);    
    //  text("1-1E-"+sConf.getValueI()+"%", wedgeX + textWidth("1-1E-"+sConf.getValueI()+"%"), wedgeY - 3);    
    text("Variant(%)", wedgeX, wedgeY - 155);
    text("Conf(%)", wedgeX + 55, wedgeY - 40);

    //-----------------------------------
    drawSideGraph(); 
    drawTooltip();
    shouldRedraw = false;
  }//end if
  noStroke();
  fill(225);
  // rect(240,winHeight-140,winWidth,winHeight);
}//end draw

public void drawEven(boolean drawStripes) {
  int textGap = PApplet.parseInt(textWidth(maxrt+" ")/oldbw)+1;
  pushMatrix();
  background(225);
  //background(hue(bottom),saturation(bottom),brightness(bottom)+50);

  //this is for the top event legend
  noStroke();
  fill(0);
  text("Ref_nt:", dataX-textWidth("Ref_nt:"), 12);
  events = new int[vdisp[0].length];
  for (int i = 0;i<vdisp[0].length;i++) {
    if (i%2==0)
      fill(150);
    else
      fill(70);
    rect(dataX + i*oldbw, 15, oldbw, 10);
    if (i%textGap==0) {
      fill(0);
      text(i*binBasePairs + minrt, dataX + i*oldbw, 12);
    }
    else if (i==vdisp[0].length-1) {
      fill(0);
      // text(maxrt,dataX + i*oldbw + (textWidth(maxrt+"")/2.0), 12);
    }
    events[i] = 0;
  } 


  drawORF();
  //draw trapezium
  noStroke();

  if (zoomBin>=0) {
    //println(binBasePairs);
    binBasePairs = max(1, sBin.getValueI());
    numBins = ceil((maxrt-minrt)/binBasePairs);
    fill(100);
    quad(dataX + (zoomBin)*oldbw, 75, dataX + zoomS, dataY-rgap, dataX + zoomS + zoomW, dataY-rgap, ceil(dataX + (zoomBin+1)*oldbw), 75 );
    fill(100, 128);
    rect(dataX + (zoomBin)*oldbw, 15, oldbw, 60);
    zoomW = binBasePairs*bpw;
    bw = ((dataWidth-zoomW)/(cols-1.0f))-cgap;
    zoomS = (bw+cgap)*zoomBin;
    drawBin();
  }



  translate(xtrans+dataX, ytrans);
  float h = (bh/ratio);
  float curx = 0;
  float cury = 0;
  int vmask = 0;
  //println(vdisp[0].length);
  // INCASE the reference changes


  int i = 0;				
  for (int l = 0;l<vdisp.length;l++) {
    i = reorder[l];
    curx = 0;
    for (int j =0;j<vdisp[i].length;j++) {
      if (j==zoomBin) {
        curx+=zoomW;
      }
      else {  
        float refVar = vdisp[i][j]; 		
        if (refVar>=0) {
          double cer = pdisp[i][j];
          fill(getColor(refVar, cer, maxvariant));
          rect(curx, cury+dataY, bw, ratio*h);
          if (drawStripes) {
            float dw = (bw/binBasePairs);
            float curex = curx;
            int minoffset = minrt-minminrt;
            int maxoffset = maxmaxrt-maxrt;
            for (int k = 0;k<binBasePairs;k++) {
              if ((j*binBasePairs + k + minoffset) < vraw[i].length - maxoffset && (getV(i, j*binBasePairs + k +minoffset)>=eweight)) {
                if (j!=zoomBin) {
                  // fill(lerpColor(bottom,eventcolor,cer-sConf.getValuef()));
                  fill(getColor(1.0f, getP(i,j*binBasePairs + k +minoffset), 1.0f));
                  rect(curex, cury+dataY, max(2, (dw)), ratio*h);
                }//end if
                events[j]++;
              }//end if
              curex+=dw;
            }//end for
          }//end if
        }//end if
        curx+=bw+cgap;
      }//end else
    }//end for  
    if (refRow == i) {
      fill(left40);
    }
    if (selectedRow!=-1 && i == reorder[selectedRow])
    {
      fill(left);
    }
    else {
      fill(coloroptions[rowcolors[i]]);
    }
    rect(-dataX, cury+dataY-ytrans, dataX, bh);
    fill(0);
    text(metadata[i], -(textWidth(metadata[i]))-10, cury+dataY-ytrans+(.75f*bh));
    cury+=bh+rgap;
    noStroke();
  }//end for
  if (zoomBin>=0) {
    stroke(0);
    strokeWeight(3);
    line( zoomS, dataY, zoomS, visibleCount*(bh+rgap)-rgap+dataY);
    line( zoomS+zoomW, dataY, zoomS+zoomW, visibleCount*(bh+rgap)-rgap+dataY);
    strokeWeight(2);
    fill(0, 0);
    if (rawcol>=0) {
      rect(zoomS + ((rawcol-(minrt-minminrt) - (zoomBin*binBasePairs))*(bpw+cgap)), dataY, bpw+cgap, visibleCount*(bh+rgap)-rgap);
    }
    else if (col>=0 && col<zoomBin) {
      rect(col*(bw+cgap), dataY, bw+cgap, visibleCount*(bh+rgap)-rgap);
    }
    else if (col>=0) {
      rect( ((col-(zoomBin+1))*(bw+cgap))+zoomS+zoomW, dataY, bw+cgap, visibleCount*(bh+rgap)-rgap);
    }
    noStroke();
  }
  else {
    if (col>=0 && mouseX <= winWidth - 2*wedgewidthonscreen) {
      stroke(0);
      strokeWeight(1);
      fill(0, 0);
      rect(col*(bw+cgap), 0+dataY, bw+cgap, visibleCount*(bh+rgap)-rgap);
      noStroke();
    }
  }
  popMatrix();

  if (drawStripes) {
    int maxe = max(events);
    for (int j = 0;j<vdisp[0].length;j++) {
      if (events[j]==0) {
        fill(bottom);
      }
      else {
        fill(lerpColor(bottom, eventcolor, .25f +(events[j]/PApplet.parseFloat(maxe))*.75f));
      }
      if (zoomBin==j) {
        strokeWeight(2);
      }//end if
      else {
        strokeWeight(1);
      }
      stroke(0);
      rect(dataX + j*oldbw, 15, oldbw, 10);
    }
    noStroke();
    fill(0);
  }
  else {
    float maxe = max(vhist);
    for (int j = 0;j<vdisp[0].length;j++) {
      if (vhist[j]==0) {
        fill(bottom);
      }
      else {
        fill(getColor(vhist[j], 0, maxe));
      }
      if (zoomBin==j) {
        strokeWeight(2);
      }//end if
      else {
        strokeWeight(1);
      }
      stroke(0);
      rect(dataX + j*oldbw, 15, oldbw, 10);
    }
    noStroke();
    fill(0);
  }
}//end drawEven


public int bpToIndex(char bp) {
  int index = -1;
  switch(bp) {
  case 'A':
  case 'a':
    index = 0;
    break;

  case 'T':
  case 't':
    index =  1;
    break;

  case 'C':
  case 'c':
    index =  2;
    break;

  case 'G':
  case 'g':
    index =  3;
    break;

  default:
    break;
  }//end switch
  return index;
}


public double getP(int i, int j) {
  if (i>=praw.length || j>=praw[i].length) {
    return -1;
  }
  double[] sample =  praw[i][j];

  double sum = 0;
  float pmask;
  int bp_i = bpToIndex(refgen[0][j]);
  boolean isSynom = true;
  int n  = 0;

  for (int k=0;k<sample.length;k++) {
    isSynom = bp_i>=0&&synom[j][bp_i][k];
    pmask = ( (nonsynomCheck.isSelected()&&isSynom) || (synomCheck.isSelected()&&!isSynom) )? 1: 0;
    //pmask = 1.0;
    if (pmask*sample[k]>0) {
      sum+= pmask*sample[k];
      n++;
    }
  }
  if (n==0) {
    return 0;
  }
  else {
    return (sum/n);
  }
}

public float getV(int i, int j) {
  
  //If the refrow is -1, then this is comparison to our own reference sequence.
  
  //Otherwise it's comparison to another point. 
  
  if (i>=vraw.length || j>=vraw[i].length) {
    return -1;
  }
  else if(refgen[i+1][j]=='N')
  {
    return sum(vraw[i][j]);
  }
  float[] sample =  vraw[i][j];
  int bp_i = bpToIndex(refgen[refRow+1][j]);
  int bp_ref = bpToIndex(refgen[i+1][j]);
  if(sum(sample)<1.0f && bp_ref>-1 && sample[bp_ref]<=0){
    sample[bp_ref]= 1.0f-sum(sample);
  }
  
  if(reference[1]!=null && reference[1].isSelected()){
    bp_ref = bp_i;
  }
  float sum = 0;
  float vmask;

  boolean isSynom = true;


  if (refRow ==-1) {
    for (int k=0;k<sample.length;k++) {
      if(k!=bp_ref){
        isSynom = bp_ref>=0&&synom[j][bp_ref][k];
      // vmask = ((synomCheck.isSelected())||isSynom)? 1: 0;
        vmask = ( (nonsynomCheck.isSelected()&&isSynom) || (synomCheck.isSelected()&&!isSynom) )? 1:0;
      //vmask = 1.0;
        sum+= vmask*sample[k];
      }
    }
    return sum;
  }
  else if(refRow==-2){
    for (int k=0;k<sample.length;k++) {
      if(k!=bp_i){
        isSynom = bp_i>=0&&synom[j][bp_i][k];
      // vmask = ((synomCheck.isSelected())||isSynom)? 1: 0;
        vmask = ( (nonsynomCheck.isSelected()&&isSynom) || (synomCheck.isSelected()&&!isSynom) )? 1:0;
      //vmask = 1.0;
        sum+= vmask*sample[k];
      }
    }
   /* if (sum(sample)==1 && bp_ref>=0 && synomCheck.isSelected()) {
      sum-= sample[bp_ref];
    }*/
    return sum;
  }
  else {
    if (refgen[refRow+1][j]=='-' && covraw[i][j]!=0) {
      return 1.0f;
    }
    else if (bp_i==-1)
      return 0.0f;
     // return oneNormRef(sample,vraw[refRow][j],synom[0]);
     return oneNormRef(sample,vraw[refRow][j],synom[j]);
    //return oneNormRef(toVector(sample, j), toVector(vraw[refRow][j], j), synom[j]);
  }//end else
}

public float[] toVector(float[] f, int index) {
  float[] f1 = new float[f.length];
  arrayCopy(f, f1);
  int bp_i = bpToIndex(refgen[0][index]);
  if (bp_i!=-1)
    f1[bp_i] = max(0, 1.0f-sum(f));
  return f1;
}

public float oneNorm(float[] f, float[] g) {
  float maxf = sum(f);
  float maxg = sum(g);
  if (maxf==0 || maxg== 0) {
    return -1;
  }
  float distfg = 0;

  for (int i = 0;i<f.length;i++) {
    distfg+= abs(((float)(f[i])/maxf)-((float)(g[i])/maxg));
  }
  //System.err.println(distfg);
  if (distfg>2.0f) {
      distfg = 2.0f;
  //  System.err.println("Problem! : " + maxf+ " " + maxg + " " + distfg + " "+f.length);
  //  System.err.println(f[0] + ","+ f[1] + "," + f[2] + "," + f[3]);
  //  System.err.println(g[0] + ","+ g[1] + "," + g[2] + "," + g[3]);
  }
  return (distfg/2.0f);
}

public float oneNormRef(float[] f, float[] g, boolean[][] synMask) {
  /*if (sum(f)==0) {
    return sum(g);
  }//end if
  else if (sum(g)==0) {
    return sum(f);
  }//end else if
  else if (synomCheck.isSelected() && nonsynomCheck.isSelected()) {
    return oneNorm(f, g);
  } */
  if (synomCheck.isSelected() && nonsynomCheck.isSelected()) {
    return oneNorm(f, g);
  } 
  else {
    float bpsum = 0;
    float sum = 0;
    for (int i = 0;i<f.length;i++) {
      if (f[i]>0) {
        bpsum = 0;
        for (int j = 0;j<g.length;j++) {
          if ((nonsynomCheck.isSelected() && synMask[j][i]) || (synomCheck.isSelected() && !synMask[j][i])) {
            bpsum+= Math.abs(g[j]-f[j]);
          }
        }
       sum+= f[i]*(bpsum/2.0f);
       //sum+=bpsum;
      }//end if
    }//end for
    if (sum>1.0f) {
      //distfg = 2.0;
      sum = 1;
   // System.err.println("Problem! : " + sum );
   // System.err.println(f[0] + ","+ f[1] + "," + f[2] + "," + f[3]);
   // System.err.println(g[0] + ","+ g[1] + "," + g[2] + "," + g[3]);
  }
    return sum;
  }//end else
}

public void calcConsensusGenome(){
   float a_ct = 0;//18
  float c_ct = 0;//19
  float g_ct = 0;//20
  float t_ct = 0;//21
  float gap_ct = 0;
  
  for (int c=0;c<vraw[0].length;c++)
  {
    //refgen[r+1] = new char[cols];
  
    a_ct = 0;
    t_ct = 0;
    c_ct = 0;
    g_ct = 0;
    
    for (int r=0;r<vraw.length;r++)
    {
      switch(refgen[r+1][c]){
        case 'A':
          a_ct++;
        break;
      
        case 'T':
          t_ct++;
        break;
        
        case 'C':
          c_ct++;
        break;
        
        case 'G':
          g_ct++;  
        break;
        
        
        default:
        break;
      }
      
      /*  a_ct += vraw[r][c][0];
        t_ct += vraw[r][c][1];
        c_ct += vraw[r][c][2];
        g_ct += vraw[r][c][3];
    */
      
    }
    if (a_ct > c_ct && a_ct>g_ct && a_ct>t_ct) {
          refgen[0][c] = 'A';
        }
        else if (c_ct>a_ct && c_ct>g_ct && c_ct>t_ct) {
          refgen[0][c] = 'C';
        }
        else if (g_ct>a_ct && g_ct>c_ct && g_ct>t_ct) {
          refgen[0][c] = 'G';
        }
        else if (t_ct>a_ct && t_ct>c_ct && t_ct>g_ct) {
          refgen[0][c] = 'T';
        }
        
        else {
          refgen[0][c] = refgen[0][c];
        }
  }
}

public void calcReferenceGenome() {
  //refRow is the new reference sequence
  float a_ct = 0;//18
  float c_ct = 0;//19
  float g_ct = 0;//20
  float t_ct = 0;//21

  for (int r=0;r<vraw.length;r++)
  {
    //refgen[r+1] = new char[cols];

    for (int c=0;c<vraw[r].length;c++)
    {
      if (bpToIndex(refgen[r+1][c])==-1) {
        a_ct = vraw[r][c][0];
        t_ct = vraw[r][c][1];
        c_ct = vraw[r][c][2];
        g_ct = vraw[r][c][3];

        if (sum(vraw[r][c])<=0.5f) {
          refgen[r+1][c] = refgen[0][c];
        }	
        else if (a_ct > c_ct && a_ct>g_ct && a_ct>t_ct) {
          refgen[r+1][c] = 'A';
        }
        else if (c_ct>a_ct && c_ct>g_ct && c_ct>t_ct) {
          refgen[r+1][c] = 'C';
        }
        else if (g_ct>a_ct && g_ct>c_ct && g_ct>t_ct) {
          refgen[r+1][c] = 'G';
        }
        else if (t_ct>a_ct && t_ct>c_ct && t_ct>g_ct) {
          refgen[r+1][c] = 'T';
        }
        else {
          refgen[r+1][c] = refgen[0][c];
        }
      }
    }
  }
}

public void drawTooltip() {
  // System.err.println("rawcol " + rawcol + "col " + col);
  if (row>=0 && row<rows && ( (col>=0 && col<cols && vdisp[row][col]>=0) || (rawcol>=0 && rawcol<=(maxrt-minrt) && getV(row, rawcol)>=0) ) ) {
    String label;
    float curvar = 0;

    if (vdisp[0].length==vraw[0].length) {
      curvar = vdisp[row][col];
      label = "ref_nt: "+(col+minrt)+" cov: "+covdisp[row][col]+"  var:"+toPercentFloat(curvar)+"% p:"+pdisp[row][col] ;//+" actg_ct,n_ct,dip_ct: "+ldisp[row][col][0]+","+ldisp[row][col][1]+","+ldisp[row][col][2];
    }//end if
    else if (rawcol>=0 && rawcol<=(maxrt-minrt)) {
      curvar = getV(row, rawcol);
      label = "ref_nt: "+(rawcol+minrt)+" cov: "+covraw[row][rawcol]+"  var:"+toPercentFloat(curvar)+"% p:"+getP(row, rawcol);//+" actg_ct,n_ct,dip_ct: "+lraw[row][rawcol][0]+","+lraw[row][rawcol][1]+","+lraw[row][rawcol][2];
    }
    else {
      curvar = vdisp[row][col];
      int refmin = floor(col*(binBasePairs)) + minrt;
      int refmax = min(maxrt, refmin+binBasePairs-1);
      label = "ref_nts: "+refmin+"-"+refmax+" cov: "+covdisp[row][col]+"  var:"+toPercentFloat(curvar)+"% p:"+pdisp[row][col];//+" actg_ct,n_ct,dip_ct: "+ldisp[row][col][0]+","+ldisp[row][col][1]+","+ldisp[row][col][2];
    }//end else
    float offset = 0;
    if (mouseX-2-xtrans+textWidth(label)+4 > winWidth) {
      offset = textWidth(label)+4;
    }//end if
    fill(tipcolor);
    // rect(mouseX-2-xtrans-offset,max(0-ytrans,mouseY-12-ytrans),textWidth(label)+4,18);
    rect(mouseX-2-xtrans-offset, max(0-ytrans, mouseY-12-ytrans), textWidth(label)+4, 18);
    fill(0);
    //text(label, mouseX-xtrans-offset+(textWidth(label)/2.0), max(12-ytrans, mouseY-ytrans));
    text(label, mouseX-xtrans-offset, max(12-ytrans, mouseY-ytrans));
  }//end if
}//end drawTooltip

public void drawORF() {
  if(orfNames!=null && orfNames.length>0){
  pushMatrix();
    translate(dataX, 25);
    int[] curORF;
    float sx;
    float ex;
    int maxDepth = max(depths);
    for (int i = 0;i<starts.length;i++) {
      sx = map(starts[i], minrt, maxrt, 0, dataWidth);
      ex = map(ends[i], minrt, maxrt, 0, dataWidth);
      pushMatrix();
      translate(sx, floor(depths[i]*((50)/PApplet.parseFloat(maxDepth+1))));
      drawArrow(ex-sx, floor((50)/PApplet.parseFloat(maxDepth+1)));
      fill(0);
      text(orfNames[i], 1,16);//textSize);
      //System.err.println("Draw ORF["+i+"]: "+starts[i]+"-"+ends[i]+" is at depth "+depths[i]);
      popMatrix();
    }
    popMatrix();
  }
  //draw histogram lines
}




public void drawArrow(float w, float h) {
  float headw = floor(min(10, w/5.0f));
  float headh = floor(h/5.0f);
  noStroke();
  fill(0);
 // rect(0, floor(headh), ceil(w-headw), floor(h-2*headh));
 // triangle(floor(w-headw), ceil(h), floor(w-headw), 0, w, ceil(h/2.0));
  fill(255);
  rect(1, floor(headh)+1, ceil(w-headw), floor(h-2*headh)-2);
  triangle(floor(w-headw)+1, ceil(h)-1, floor(w-headw)+1, 2, ceil(w-2), ceil(h/2.0f));
}


public void resetForBin()
{
  int range = maxrt-minrt;
  numBins = ceil(range/binBasePairs);
  bw = (dataWidth/PApplet.parseFloat(numBins));
  if (bw>=1) {
    sample(binBasePairs);
    //println(bw + "--" + binBasePairs);
  }
  else {
    sample(minBasePairs);
    binBasePairs = minBasePairs;
    bw = (dataWidth/PApplet.parseFloat((range/minBasePairs)));
    //println(bw + "--" + minBasePairs);
  }
  prevBinVal = binBasePairs;
  oldbw = bw;      
  //sConf.setLimits(maxn*50,0,max(25,maxn));     
  //tConf.setText(str(maxn*50));
  //sVar.setLimits(maxvariant*.4,0,maxvariant);
  //tVar.setText(str(maxvariant*.4));

  shouldRedraw = true;

  //perV1.changeLabel( str(maxvariant*2), 120,40);
  //perV1 = new GLabel(this,str(maxvariant*2), winWidth - 35, 70, 120);
  //println("Variant threshold changed to " + maxvariant);
}

//------------------------------------------------------------------
////////////////////        FEEDBACK            ////////////////////
//------------------------------------------------------------------

public void handleSliderEvents(GValueControl slider, GEvent event) {
  shouldRedraw = true;
  if (slider == sBin) {
    //println(binBasePairs);
    binBasePairs = sBin.getValueI();
    resetForBin();
  }
  else if (slider == sEvent) {
    eweight= sEvent.getValueF();         
    //println("Event variant threshold changed to " + sEvent.getValuef());
  }
}

public void handleToggleControlEvents(GToggleControl selected, GEvent event) {
  if (selected == stripeCheck) {
    if (stripeCheck.isSelected())
      mode = 2;
    else
      mode = 0;
    shouldRedraw = true;
  }
  else if (selected == synomCheck || selected == nonsynomCheck) {
    resetForBin();
  }
  else if (selected == reference[0]) {
    refRow = -1;
    resetForBin();
  }
  else if(selected == reference[1]){
    refRow = -1;
    resetForBin();
  }
  else {
    for (int i = 2;i<reference.length;i++) {
      if (selected == reference[i])
      {
        refRow = reorder[i-2];
        resetForBin();
      }
    }
  }
}

public void handleTextEvents(GEditableTextControl tfield, GEvent event) {
  //data limit
  if (tfield==tstart && event==GEvent.ENTERED) {
    int newmin = PApplet.parseInt(tstart.getText());
    if (newmin>=minminrt && newmin<maxrt) {
      minrt = newmin;
      resetForBin();
    }
    else if (newmin<=minminrt) {
      tstart.setText(str(minminrt));
      resetForBin();
    }
    else {
      tstart.setText(str(minrt));
      resetForBin();
    }
  }  
  if (tfield==tend && event==GEvent.ENTERED) {
    int newmax = PApplet.parseInt(tend.getText());
    if (newmax<=maxmaxrt && newmax>minrt) {
      maxrt = newmax;
      resetForBin();
    }
    else if (newmax>=maxmaxrt) {
      tend.setText(str(maxmaxrt));
      resetForBin();
    }
    else {
      tend.setText(str(maxrt));
      resetForBin();
    }
  }
}

public void keyPressed() {
  //pressed = true;
}
public void keyReleased() {
  pressed = false; 
  //prevRow = -1;
  //currRow = -1;
}

//------------------------------------------------------------------
////////////////////        MOUSE            ////////////////////
//------------------------------------------------------------------
public void mousePressed() {
  oldx = mouseX;
  oldy = mouseY;
  if (mouseButton==RIGHT && oldx>=dataX && oldy<winHeight - 160 && oldy>dataY && oldx<=dataX+dataWidth+bw) {
    if (zoomBin==-1 || rawcol==-1) {
      zoomBin = col;
      shouldRedraw = true;
    }
    else if (rawcol>=-1) {
      zoomBin = -1;
      bw = oldbw;
    }
  }
  if (oldy<(winHeight - 160) && oldy>dataY && oldx<dataX) { // && oldx<dataX+ dataWidth){
    if (mouseButton==RIGHT) {
      int changeRow =   reorder[PApplet.parseInt((oldy - dataY)/(bh + rgap))];
      // selectedRow = reorder[int((oldy - dataY)/(bh + rgap))];
      // rowcolors[selectedRow] = (rowcolors[selectedRow]+1) % (coloroptions.length);
      rowcolors[changeRow] = (rowcolors[changeRow]+1) % (coloroptions.length);
      // println(" row = " + selectedRow);
    }
    else {
      selectedRow = PApplet.parseInt((oldy - dataY)/(bh + rgap));
      pressed = true;
    }
  }
  if (mouseButton==LEFT && zoomBin>=0 && oldy<(winHeight - 160) && oldy>dataY && oldx>dataX + zoomS && oldx<dataX + zoomS + zoomW) { // && oldx<dataX+ dataWidth){
    pressed = true;

    //wedge.draw();
  }

  if (mouseButton==LEFT && oldy>=(winHeight - 160) && oldx<30 + wedgewidthonscreen*2) {
    wedge.mousePressedAlt(oldx, oldy);
    //wedge.draw();
  }
  shouldRedraw = true;
}//end mousePressed

public void mouseClicked() {
}//end mouseClicked

public void mouseReleased() {
  pressed = false;
  selectedRow = -1;
  wedge.mouseReleasedAlt();
  shouldRedraw = true;
}


public void mouseMoved() {
  int oldCol = col;
  rawcol = -1;
  if (zoomBin>=0) {
    if (mouseX< winWidth - 2*wedgewidthonscreen) {
      if ((mouseX-xtrans-dataX)<=zoomS) {
        col = floor( (mouseX-xtrans-dataX)/(bw+cgap));
      }
      else if ((mouseX-xtrans-dataX)>=zoomS+zoomW) {
        col =  floor( (mouseX-xtrans-dataX-zoomS-zoomW)/ (bw+cgap)) + (zoomBin+1);
      }
      if ((mouseX-xtrans-dataX)>zoomS && (mouseX-xtrans-dataX)<zoomS+zoomW) {
        oldCol = rawcol;
        rawcol = (zoomBin*binBasePairs) +  floor( (mouseX-xtrans-dataX-zoomS)/ (bpw+cgap)) + (minrt-minminrt);
      }
    }
  }//end if
  else {
    col = floor( (mouseX-xtrans-dataX)/(bw+cgap));
  }
  row = floor((mouseY-ytrans-dataY)/(bh+rgap));
  if (row>=0 && row<reorder.length) {
    row = reorder[row];
  }
  if (col!=oldCol || rawcol !=-1)
    shouldRedraw = true;
}

public void mouseDragged() {
  if (mouseButton==LEFT && pressed == true && mouseY<(winHeight - 160) && mouseY>dataY && mouseX<dataX)
  {
    draggedRow = PApplet.parseInt((mouseY - dataY)/(bh + rgap));

    if (selectedRow!=draggedRow)
    {
      switchrows(selectedRow, draggedRow);
      selectedRow = draggedRow;
      shouldRedraw = true;
    }
  }

  if (mouseButton==LEFT && oldy>(winHeight - 160) && oldx<30 + wedgewidthonscreen*2) {
    wedge.mouseDraggedAlt(mouseX, mouseY);
    wedge.draw();
    //update slider values for varint - perfect
    vweight = wedge.right;
    //sVar.setLimits(maxvariant*wedge.right,0,maxvariant);
    // tVar.setText(str(maxvariant*wedge.right));
    shouldRedraw = true;
  }

  if (mouseButton==RIGHT && oldy<winHeight - 160 && oldy>dataY && mouseX>=dataX && mouseX<=dataX+dataWidth) {
    if (zoomBin==-1 || rawcol==-1) {
      zoomBin = col;
      shouldRedraw = true;
    }
  }
  if (oldy<winHeight - 75 && oldx<=winWidth - wedgewidthonscreen*2) {
    //xtrans-=oldx-mouseX;
    //ytrans-=oldy-mouseY;
    oldx = mouseX;
    oldy = mouseY;
  }
}//end mouseDragged


//------------------------------------------------------------------
////////////////////        LOAD            ////////////////////
//------------------------------------------------------------------


public void loadTest() {
  //need to set:  
  //  vraw
  //  lraw
  //  rows
  //  cols 
  //  genome = new char[cols];
  //  refgen = new char[rows+1][cols];
  //  metadata = new String[rows];
  //  rowcolors = new int[rows];
  //  synom = new boolean[rows][rows][cols];
  //  

  maxmaxrt = 0;
  minminrt = 999999;
  maxrt = 0;
  minrt = 999999;
  rows = 0;
  names = new HashMap<String,Integer>();
  //System.err.println(dir);
  ArrayList<String> dataFiles = new ArrayList<String>();
  ArrayList<String> referenceFiles = new ArrayList<String>();
  String synomFile = "";
  
  File path = new File(sketchPath("Virus Data"));
  File[] files = path.listFiles();

  for(File file:files){
    if(file.getPath().endsWith(".fasta")||file.getPath().endsWith(".fa"))
      referenceFiles.add(file.getPath());
    else if(file.getPath().endsWith(".csv")&& isDataCSV(file.getPath())>=0){
      dataFiles.add(file.getPath());
      checkRows(file.getPath());
      checkMaxMin(file.getPath());
    }
    else if(file.getPath().endsWith(".gtf") || file.getPath().endsWith(".gbk") || file.getPath().endsWith(".gff")){
      synomFile = file.getPath();
    }
  }
  //checkRows(dataPath("SHIV_nef_540-01/SHIV_nef.sam"));
  //checkMaxMin(dataPath("SHIV_nef_540-01/SHIV_nef.sam"));

  
  rows = names.size();
  
  metadata = new String[rows];
  String[] temp = new String[rows];
  temp = names.keySet().toArray(temp);
  
  for(int i = 0;i<metadata.length;i++){
    int tempI = ((Integer)(names.get(temp[i]))).intValue();
    metadata[tempI] = (String)temp[i];

  }
  
  for(int i = 0;i<metadata.length;i++){
      if(textWidth(metadata[i])>dataX)
        dataX = ceil(textWidth(metadata[i]))+30;
        dataWidth = (winWidth-dataX)-25 - sideGraphWidth;
  }

  maxmaxrt++;
  cols = maxmaxrt - minminrt;
  // System.err.println("max "+maxmaxrt+" min "+minminrt + " rows"+rows+" cols"+cols);   

  vraw = new float[rows][cols][4]; // a_%,t_%,c_5,g_% 
  praw = new double[rows][cols][4]; // a_p, t_p, c_p, g_p
  covraw = new int[rows][cols];
  refgen = new char[rows+1][cols];   
  rowcolors = new int[rows];
  synom = new boolean[cols][4][4];
  for (int i = 0;i<refgen.length;i++) {
    for (int j= 0;j<refgen[i].length;j++) {
      refgen[i][j] = 'N';
      for (int k = 0;k<4;k++) {
        synom[j][k] = new boolean[] {
          false, false, false, false
        };
      }
    }
  } 

  for (int i = 0;i<vraw.length;i++) {
    for (int j = 0;j<vraw[i].length;j++) {
      vraw[i][j] = new float[] {
        0, 0, 0, 0
      };
      praw[i][j] = new double[] {
        0, 0, 0, 0
      };
      covraw[i][j] = 0;
    }//end for
  }



  //System.err.println("calculated synon.");

 for(String aFile:dataFiles){
   loadAll(aFile);
 }
//

 for(String aFile:referenceFiles){
     loadFasta(aFile);
 }
 
  if(synomFile!=""){
    calcSynom(synomFile);
  }
  else{
    setupcodontable();
    calcConsensusGenome();
  }

 //If we have synonymy data (from a gbk, gtf, or csv file) then we can calculate synom

 // loadAll(dataPath("Virus Data/SNP.csv"));
  
  //loadAll(dataPath("SHIV_nef_540-01/SHIV_nef.sam"));
  //System.err.println("loaded data.");
  
//If we have reference data from a fasta file, then we can use it. otherwise we need to generate the consensus sequence ourselves  

  //loadFasta(dataPath("SHIV_nef_540-01/SHIV_nef.fasta"));
  // System.err.println("calculated refs.");
}//end loadTest


public void loadDir(String dir) {
  //need to set:  
  //  vraw
  //  lraw
  //  rows
  //  cols 
  //  genome = new char[cols];
  //  refgen = new char[rows+1][cols];
  //  metadata = new String[rows];
  //  rowcolors = new int[rows];
  //  synom = new boolean[rows][rows][cols];
  //     
  //System.err.println(dir);
  File[] files = new File(dir).listFiles();
  String ext;


  for (int i = 0;i<files.length;i++) {
    ext = files[i].getPath().substring(files[i].getPath().lastIndexOf('.')+1);
    if (ext.equals("csv")||ext.equals("sam"))
      rows++;
    checkMaxMin(files[i].getPath());
  //  System.err.println(files[i].getPath()+": max "+maxmaxrt+" min "+minminrt);
  }//end for
  maxmaxrt++;

  cols = maxmaxrt - minminrt;


  vraw = new float[rows][cols][4]; // a_%,t_%,c_5,g_% 
  praw = new double[rows][cols][4]; // a_p, t_p, c_p, g_p
  covraw = new int[rows][cols];
  refgen = new char[rows+1][cols];   
  metadata = new String[rows];
  rowcolors = new int[rows];
  synom = new boolean[cols][4][4];
  for (int i = 0;i<refgen.length;i++) {
    for (int j= 0;j<refgen[i].length;j++) {
      refgen[i][j] = 'N';
      for (int k = 0;k<4;k++) {
        synom[j][k] = new boolean[] {
          false, false, false, false
        };
      }
    }
  } 


  String reffname = dataPath("Test.gbk");
  calcSynom(reffname);

  for (int i = 0;i<files.length;i++) {
    metadata[i] = files[i].getName().substring(0, files[i].getName().lastIndexOf('.'));
    loadOne(files[i].getPath());
  }//end for
  loadFasta(dataPath("Test.fasta"));
}//end loadDir

public void loadFasta(String filename) {
  String[] lines = loadStrings(filename);
  String seqname;
  char[] sequence;
  int curRow = -1;
  int index = -1;
  int curDex;
  //System.err.println(lines.length);
  for (String line:lines) {
    if (line.charAt(0)=='>') {
      seqname = line.substring(1);
      //  System.err.println(seqname);
      curRow = search(metadata, seqname);
      if (curRow==-1) {
        //  System.err.println("Can't find "+seqname);
      }
      index = 0;
    }//end if
    else if (curRow!=-1) {
      sequence = line.toCharArray();
      for (int i = 0;i<sequence.length;i++) {
        curDex = index+i+1;
        if (curDex>=minminrt && curDex<maxmaxrt) {
          refgen[curRow+1][curDex-minminrt]=sequence[i];
          if (sequence[i]=='-') {
            // System.err.println(curRow+" "+curDex);
          }
        }
      }
      index+=sequence.length;
    }

    //System.err.println(line);
  }
}//end loadFasta

public int search(String[] strings, String val) {
  for (int i = 0;i<strings.length;i++) {
    if (strings[i].equals(val))
      return i;
  }
  return -1;
}


public void checkRows(String filename) {
  String ext = filename.substring(filename.lastIndexOf('.')+1);
  if (ext.equals("csv")) {
    checkRowsCSV(filename);
  }
  else if (ext.equals("sam")) {
    checkRowsSAM(filename);
  }
}//end checkRows

public void checkRowsCSV(String filename) {
  int name_col = -1;
  String[] lines = loadStrings(filename);
  String[] header = lines[0].split(",");
  String c_name;
  for (int i = 0;i<header.length;i++) {
    c_name = trim(header[i]);
    if (c_name.equals("Sequence Name")) {
      name_col = i;
    }
  }

  if (name_col==-1) {
    int index = names.size();
    String seqName = filename.substring(filename.lastIndexOf(File.separator)+1,filename.lastIndexOf('.'));
    if(!names.containsKey(seqName)){
      names.put(seqName,index);
      index++;
    }
  }
  else{  
    String[] aline;
    int index = names.size();
    for (int i = 1;i<lines.length;i++) {
      aline = (lines[i].replaceAll("(\")(\\d+)(,)(\\d+)(\")", "$2$4")).split(",");
      if (!aline[name_col].equals("Consensus") && !names.containsKey(aline[name_col])) {
        names.put(aline[name_col],index);
        index++;
        // System.err.println(aline[name_col]);
      }
    }
  }
}//end checkRowsCSV

public void checkRowsSAM(String filename) {
  System.out.println("Checking "+filename+" for individual sequences");
  BufferedReader reader = createReader(filename);
  String aline = "";
  String[] tokens;
  int index = 0;
  while (aline!=null) {
    try {
      aline = reader.readLine();
      if (aline!=null) {
        tokens = splitTokens(aline, "\t");

        if (tokens!=null && tokens.length>0 && !isHeaderLine(tokens[0])) {
          if (!names.containsKey(tokens[2])) {
           // System.err.println("Found sequence "+tokens[2]);
            names.put(tokens[2],index);
            index++;
          }
          if (PApplet.parseInt(tokens[4])<minminrt) {
            minminrt = PApplet.parseInt(tokens[4]);
          }
          if (PApplet.parseInt(tokens[3])+tokens[9].length()>maxmaxrt) {
            maxmaxrt = PApplet.parseInt(tokens[3])+tokens[9].length();
          }
        }//end if
      }
      minrt = minminrt;
      maxrt = maxmaxrt;
    }//end try
    catch(IOException e) {
      e.printStackTrace();
    }//end catch
  }//end while

 // System.err.println("Finished checking "+filename+", found "+rows+" sequences, new range of "+minminrt+"-"+maxmaxrt);
}//end checkRowsSAM


public void checkMaxMin(String filename) {
  String ext = filename.substring(filename.lastIndexOf('.')+1);
  if (ext.equals("csv")) {
    checkMaxMinCSV(filename);
  }
}//end checkRows

public void checkMaxMinCSV(String filename) {
  int id_col = -1;
  String[] lines = loadStrings(filename);
  String[] header = lines[0].split(",");
  String c_name;
  for (int i = 0;i<header.length;i++) {
    c_name = trim(header[i]);
    //      if(c_name.equals("Nucleotide") || c_name.equals("Min (original sequence)") || c_name.equals("Minimum")){
    if (c_name.equals("Min (with gaps)")) {
      id_col = i;
    }
  }

  if (id_col==-1) {
    for (int i = 0;i<header.length;i++) {
      c_name = trim(header[i]);
      //      if(c_name.equals("Nucleotide") || c_name.equals("Min (original sequence)") || c_name.equals("Minimum")){
      if (c_name.equals("Minimum") || c_name.equals("Nucleotide")) {
        id_col = i;
      }
    }
  }

  if (id_col==-1) {
    System.err.println("Improper format in " +filename);
  }  
  String[] aline;
  int rt = 0;
  for (int i = 1;i<lines.length;i++) {
    aline = (lines[i].replaceAll("(\")(\\d+)(,)(\\d+)(\")", "$2$4")).split(",");
    if (aline.length>id_col) {
      rt = PApplet.parseInt(aline[id_col]);
      if (rt<minminrt) {
        minminrt = rt;
        minrt = rt;
      }
      if (rt>maxmaxrt) {
        maxmaxrt = rt;
        maxrt = rt;
      }
    }
  }
}//end checkMaxMinCSV

public boolean loadOne(String filename) {
  String ext = filename.substring(filename.lastIndexOf('.')+1);
  if (ext.equals("csv")) {
    return loadOneCSV(filename);
  }
  else if (ext.equals("sam")) {
    return loadOneSAM(filename);
  }
  return false;
}

public boolean loadOneCSV(String filename) {
  
  int index = ((Integer)(names.get(filename))).intValue();
  // System.err.println("Loading "+filename);
  String[] lines = loadStrings(filename);
  String[] header = lines[0].split(",");

  int id_col = -1;
  int ref_col = -1;
  int varbp_col = -1;
  int var_col = -1;
  int ct_col = -1;
  int p_col = -1;
  int syn_col = -1;
  int change_col = -1;
  int poly_col = -1;
  String c_name;
  for (int i = 0;i<header.length;i++) {
    c_name = trim(header[i]);
    // if(c_name.equals("Nucleotide") || c_name.equals("Min (with gaps)") || c_name.equals("Minimum")){
    if (c_name.equals("Min (with gaps)")) {
      id_col = i;
      // System.err.println("Found id col: "+i);
    }//end if
    else if (c_name.equals("Change")) {
      change_col = i;
    }
    else if (c_name.equals("Reference Nucleotide(s)")) {
      ref_col = i;
      // System.err.println("Found ref col: "+i);
    }
    else if (c_name.equals("Polymorphism Type")) {
      poly_col = i;
    }
    else if (c_name.equals("Variant Nucleotide(s)")) {
      varbp_col = i;
      //System.err.println("Found v_n col: "+i);
    }
    else if (c_name.equals("Variant Frequency")) {
      var_col = i;
      // System.err.println("Found v% col: "+i);
    }
    else if (c_name.equals("Coverage")) {
      ct_col = i;
      // System.err.println("Found c# col: "+i);
    }
    else if (c_name.equals("Variant P-Value (approximate)") || c_name.equals("Strand-Bias >50% P-value")) {
      p_col = i;
      // System.err.println("Found p col: "+i);
    }
    else if (c_name.equals("Amino Acid Change")) {
      syn_col = i;
    }
  }//end for

  if (id_col==-1) {
    for (int i = 0;i<header.length;i++) {
      c_name = trim(header[i]);
      if (c_name.equals("Minimum") || c_name.equals("Nucleotide")) {
        id_col = i;
        // System.err.println("Found id col: "+i);
      }//end if
    }
  }


  for (int i = 0;i<vraw[index].length;i++) {
    vraw[index][i] = new float[] {
      0, 0, 0, 0
    };
    praw[index][i] = new double[] {
      0, 0, 0, 0
    };
    covraw[index][i] = 0;
  }//end for

  int c;
  int bp_i = -1;
  String col_id;
  String[] change;
  String[] aline;
  String type;
  for (int i = 1;i<lines.length;i++) {
    aline = (lines[i].replaceAll("(\")(\\d+)(,)(\\d+)(\")", "$2$4")).split(",");
    if (poly_col!=-1 && aline.length>=poly_col)
      type = aline[poly_col];
    else
      type = "";

    if (poly_col==-1 || (!(aline[1].equals("CDS")) && (type.equals("SNP (transition)") || type.equals("SNP (transversion)") || type.equals("Substitution") ))) {
      //System.err.println(lines[i]);
      //System.err.println(lines[i].replaceAll("(\")(\\d+)(,)(\\d+)(\")","$2$4"));
      c = PApplet.parseInt(aline[id_col])-minminrt;

      bp_i = -1; 
      if (ref_col==-1 && change_col!=-1) {
        // System.err.println(lines[i]);
        //  System.err.println(filename+"Line "+i+". c="+aline[id_col]+"-"+minminrt+" = "+c+ " , type = "+type+ " p value =" + Double.parseDouble(aline[p_col]));

        change = (trim(aline[change_col])).split(" ->");
        if (change.length==2) {
          refgen[index+1][c] = trim(change[0]).charAt(0);
          bp_i = bpToIndex(trim(change[1]).charAt(0));
        }
      }
      else {
        //System.err.println(filename+"Line "+i+". c="+aline[id_col]+"-"+minminrt+" = "+c+ " , type = "+type+ " p value =");
        refgen[index+1][c] = trim(aline[ref_col]).charAt(0);
        bp_i = bpToIndex(trim(aline[varbp_col]).charAt(0));
      }

      vraw[index][c][bp_i] = toFloatPercent(aline[var_col]);
      praw[index][c][bp_i] = Double.parseDouble(aline[p_col]);//(new BigDecimal(aline[p_col])).doubleValue();
      if (ct_col!=-1) {
        covraw[index][c] = PApplet.parseInt(aline[ct_col]);
        if (covraw[index][c]>maxcovraw) {
          maxcovraw = covraw[index][c];
          // System.err.println("raw: " + maxcovraw);
        }
      }
      if (aline.length>syn_col) {
        if (bpToIndex(refgen[0][c])!=-1) {
          synom[c][bpToIndex(refgen[0][c])][bp_i] = trim(aline[syn_col]).length()>0;
        }
        else if (change_col!=-1) {
          change = (trim(aline[change_col])).split(" ->");
          synom[c][bpToIndex(trim(change[0]).charAt(0))][bp_i] = trim(aline[syn_col]).length()>0;
        }
      }
    }
    else {
      //System.err.println(lines[i]);
    }
  }//end for
  System.out.println("Successfully loaded "+filename);
  return true;
}//end loadOneCSV

public boolean isHeaderLine(String header) {
  if (header.equals("@HD") || header.equals("@SQ")||header.equals("@RG")||header.equals("@PG"))
    return true;
  return false;
}

public boolean loadOneSAM(String filename) {
  // System.err.println("Loading "+filename);
  int index = ((Integer)(names.get(filename))).intValue();
  
  int[][] vrawTemp = new int[vraw[index].length][vraw[index][0].length];

  for (int i = 0;i<vraw[index].length;i++) {
    vraw[index][i] = new float[] {
      0, 0, 0, 0
    };
    praw[index][i] = new double[] {
      0, 0, 0, 0
    };
    vrawTemp[i] = new int[] {
      0, 0, 0, 0
    };
    covraw[index][i] = 0;
  }//end for

  BufferedReader reader = createReader(filename);
  String aline = "";
  String[] tokens;
  int c;
  char[] reads;
  boolean inBounds;
  int extent;
  int bp_i;
  while (aline!=null) {
    try {
      aline = reader.readLine();
      if (aline!=null) {
        tokens = splitTokens(aline, "\t");
        if (tokens!=null && tokens.length>0 && !isHeaderLine(tokens[0])) {
          c = PApplet.parseInt(tokens[3])-minminrt;
          extent = tokens[9].length();
          if (c+extent >= 0) {
            reads = tokens[9].toCharArray();
            for (int i = 0;i<reads.length;i++) {
              inBounds = (c+i>=0 && c+i<(vrawTemp.length));
              if (inBounds) {
                bp_i = bpToIndex(reads[i]);
                vrawTemp[c+i][bp_i]++;
                covraw[index][c+i]++;
                if (!tokens[10].equals("*")) {
                  praw[index][c+i][bp_i]+= (-10 * Math.log10( Character.getNumericValue(reads[i])-33));
                }//end if
              }//end if
            }//end for
          }//end if
        }//end if
      }//ned if
    }//end try
    catch(IOException e) {
      e.printStackTrace();
    }//end catch
  }//end while

    for (int i = 0;i<praw[index].length;i++) {
    if (covraw[index][i]>maxcovraw) {
      maxcovraw = covraw[index][i];
    }
    for (int j = 0;j<praw[index][i].length;j++) {
      vraw[index][i][j] = ((float)vrawTemp[i][j])/((float)sum(vrawTemp[i]));
      praw[index][i][j] = ((float)praw[index][i][j])/((float)vrawTemp[i][j]);
    }
  }

  System.out.println("Successfully loaded "+filename);
  return true;
}//end loadOneSAM


public int isDataCSV(String filename){
  String[] lines = loadStrings(filename);
  String[] header = lines[0].split(",");

  int name_col = -1;
  int id_col = -1;
  int ref_col = -1;
  int varbp_col = -1;
  int var_col = -1;
  int ct_col = -1;
  int p_col = -1;
  int syn_col = -1;
  int change_col = -1;
  int poly_col = -1;
  String c_name;
  for (int i = 0;i<header.length;i++) {
    c_name = trim(header[i]);
    // if(c_name.equals("Nucleotide") || c_name.equals("Min (with gaps)") || c_name.equals("Minimum")){
    if (c_name.equals("Sequence Name")) {
      name_col = i;
    }
    else if (c_name.equals("Min (with gaps)")) {
      id_col = i;
      // System.err.println("Found id col: "+i);
    }//end if
    else if (c_name.equals("Change")) {
      change_col = i;
    }
    else if (c_name.equals("Reference Nucleotide(s)")) {
      ref_col = i;
      // System.err.println("Found ref col: "+i);
    }
    else if (c_name.equals("Polymorphism Type")) {
      poly_col = i;
    }
    else if (c_name.equals("Variant Nucleotide(s)")) {
      varbp_col = i;
      //System.err.println("Found v_n col: "+i);
    }
    else if (c_name.equals("Variant Frequency")) {
      var_col = i;
      // System.err.println("Found v% col: "+i);
    }
    else if (c_name.equals("Coverage")) {
      ct_col = i;
      // System.err.println("Found c# col: "+i);
    }
    else if (c_name.equals("Variant P-Value") || c_name.equals("Variant P-Value (approximate)") || c_name.equals("Strand-Bias >50% P-value")) {
      p_col = i;
      // System.err.println("Found p col: "+i);
    }
    else if (c_name.equals("Amino Acid Change")) {
      syn_col = i;
    }
  }//end for
  
  if (id_col==-1) {
    for (int i = 0;i<header.length;i++) {
      c_name = trim(header[i]);
      if (c_name.equals("Minimum") || c_name.equals("Nucleotide")) {
        id_col = i;
        // System.err.println("Found id col: "+i);
      }//end if
    }
  }
  
  boolean isValid = false;
  isValid = (p_col!=-1)&&(var_col!=-1)&&(id_col!=-1)&&(ct_col!=-1)&&(change_col!=-1 || varbp_col!=-1);
  if(isValid){
    if(name_col!=-1)
      return 1;
    else
      return 0;
  }
  return -1;
}


public boolean loadAll(String filename) {
  String ext = filename.substring(filename.lastIndexOf('.')+1);
  if (ext.equals("csv")) {
    return loadAllCSV(filename);
  }
  else if (ext.equals("sam")) {
    loadOneSAM(filename);
    return true;
  }

  return false;
}//end loadAll

public boolean loadAllCSV(String filename) {
  // System.err.println("Loading "+filename);
  String[] lines = loadStrings(filename);
  String[] header = lines[0].split(",");

  int name_col = -1;
  int id_col = -1;
  int ref_col = -1;
  int varbp_col = -1;
  int var_col = -1;
  int ct_col = -1;
  int p_col = -1;
  int syn_col = -1;
  int change_col = -1;
  int poly_col = -1;
  String c_name;
  for (int i = 0;i<header.length;i++) {
    c_name = trim(header[i]);
    // if(c_name.equals("Nucleotide") || c_name.equals("Min (with gaps)") || c_name.equals("Minimum")){
    if (c_name.equals("Sequence Name")) {
      name_col = i;
    }
    else if (c_name.equals("Min (with gaps)")) {
      id_col = i;
      // System.err.println("Found id col: "+i);
    }//end if
    else if (c_name.equals("Change")) {
      change_col = i;
    }
    else if (c_name.equals("Reference Nucleotide(s)")) {
      ref_col = i;
      // System.err.println("Found ref col: "+i);
    }
    else if (c_name.equals("Polymorphism Type")) {
      poly_col = i;
    }
    else if (c_name.equals("Variant Nucleotide(s)")) {
      varbp_col = i;
      //System.err.println("Found v_n col: "+i);
    }
    else if (c_name.equals("Variant Frequency")) {
      var_col = i;
      // System.err.println("Found v% col: "+i);
    }
    else if (c_name.equals("Coverage")) {
      ct_col = i;
      // System.err.println("Found c# col: "+i);
    }
    else if (c_name.equals("Variant P-Value (approximate)") || c_name.equals("Strand-Bias >50% P-value")) {
      p_col = i;
      // System.err.println("Found p col: "+i);
    }
    else if (c_name.equals("Amino Acid Change")) {
      syn_col = i;
    }
  }//end for


  if (id_col==-1) {
    for (int i = 0;i<header.length;i++) {
      c_name = trim(header[i]);
      if (c_name.equals("Minimum") || c_name.equals("Nucleotide")) {
        id_col = i;
        // System.err.println("Found id col: "+i);
      }//end if
    }
  }
  
  int index = -1;
  int c;
  int bp_i = -1;
  String col_id;
  String[] change;
  String[] aline;
  String type;
  for (int i = 1;i<lines.length;i++) {

    aline = (lines[i].replaceAll("(\")(\\d+)(,)(\\d+)(\")", "$2$4")).split(",");
    if (poly_col!=-1 && aline.length>=poly_col)
      type = aline[poly_col];
    else
      type = "";

    if(name_col==-1)
      index = search(metadata, filename.substring(filename.lastIndexOf(File.separator)+1,filename.lastIndexOf('.')));  
    else
      index = search(metadata, aline[name_col]);
      
    if ( (name_col==-1 || !aline[name_col].equals("Consensus")) && (poly_col==-1 || (!(aline[1].equals("CDS")) && (type.equals("SNP (transition)") || type.equals("SNP (transversion)") || type.equals("Substitution") )))) {
      //System.err.println(lines[i]);
      //System.err.println(lines[i].replaceAll("(\")(\\d+)(,)(\\d+)(\")","$2$4"));
      c = PApplet.parseInt(aline[id_col])-minminrt;

      bp_i = -1; 
      if (ref_col==-1 && change_col!=-1) {
        // System.err.println(lines[i]);
        //  System.err.println(filename+"Line "+i+". c="+aline[id_col]+"-"+minminrt+" = "+c+ " , type = "+type+ " p value =" + Double.parseDouble(aline[p_col]));

        change = (trim(aline[change_col])).split(" ->");
        if (change.length==2) {
          refgen[index+1][c] = trim(change[0]).charAt(0);
          bp_i = bpToIndex(trim(change[1]).charAt(0));
        }
      }
      else if(ref_col!=-1) {
        //System.err.println(filename+"Line "+i+". c="+aline[id_col]+"-"+minminrt+" = "+c+ " , type = "+type+ " p value =");
        refgen[index+1][c] = trim(aline[ref_col]).charAt(0);
        bp_i = bpToIndex(trim(aline[varbp_col]).charAt(0));
      }
      else{
        bp_i = bpToIndex(trim(aline[varbp_col]).charAt(0));
      }
      

      vraw[index][c][bp_i] = toFloatPercent(aline[var_col]);
      praw[index][c][bp_i] = Double.parseDouble(aline[p_col]);//(new BigDecimal(aline[p_col])).doubleValue();
      if (ct_col!=-1) {
        covraw[index][c] = PApplet.parseInt(aline[ct_col]);
        if (covraw[index][c]>maxcovraw) {
          maxcovraw = covraw[index][c];
          // System.err.println("raw: " + maxcovraw);
        }
      }
      if (syn_col!=-1 && aline.length>syn_col) {
        if (bpToIndex(refgen[0][c])!=-1) {
          synom[c][bpToIndex(refgen[0][c])][bp_i] = trim(aline[syn_col]).length()>0;
        }
        else if(change_col!=-1 && syn_col!=-1){
          change = (trim(aline[change_col])).split(" ->");
          synom[c][bpToIndex(trim(change[0]).charAt(0))][bp_i] = trim(aline[syn_col]).length()>0;
        }
      }
    }
    else {
      //System.err.println(lines[i]);
    }
  }//end for

  return true;
}//end loadAllCSV

public float toFloatPercent(String percent) {
  String pf = percent.replaceAll("%", "");
  if (Float.isNaN(PApplet.parseFloat(pf)/100.0f)) {
    pf = trim(percent).substring(0, percent.indexOf("%"));
    //System.err.println("%: "+pf);
    return 0;
  }
  return PApplet.parseFloat(pf)/100.0f;
}//end toFloatPercent

public String toPercentFloat(float value) {
  int rounded = round( value*1000);
  float newVal = rounded / 10.0f;
  return newVal+"%";
}

public void calcSynom(String filename) {
  setupcodontable();
  String ext = filename.substring(filename.lastIndexOf('.')+1);
  // System.err.println(ext);
  String[] lines = loadStrings(filename);
  String[] aline;
  String[]pairs;
  String[] pair;
  int[] depthEnds = new int[] {
    minminrt
  };

  boolean haveReference = false;


  if (ext.equals("csv")) {
    starts = new int[lines.length];
    ends = new int[lines.length];
    depths = new int[lines.length];
    orfNames = new String[lines.length];  
    for (int i = 0;i<lines.length;i++) {
      aline = lines[i].split(",");
      pairs = aline[0].split(";");

      for (int j = 0;j<pairs.length;j++) {
        pair = pairs[j].split("-");
        starts[i] = PApplet.parseInt(pair[0]);
        if (starts[1]<minminrt) {
          //   minminrt = starts[1];
        }
        ends[i] = PApplet.parseInt(pair[1]);
        if (ends[i]>maxmaxrt) {
          //   maxmaxrt = ends[i];
        }
        orfNames[i] = "ORF"+i;
      }
    }
  }
  else if (ext.equals("gbk")) {
    int numORFs = 0;
    for (int i = 0;i<lines.length;i++) {
      if (trim(lines[i]).length()>=3 && trim(lines[i]).substring(0, 3).equals("ORF")) {
        numORFs++;
      }//end if
      else {
      }
    }//end for
    starts = new int[numORFs];
    ends = new int[numORFs];
    depths = new int[numORFs];
    orfNames = new String[numORFs];
    numORFs = 0;
    for (int i = 0;i<lines.length;i++) {
      if (trim(lines[i]).length()>=3 && trim(lines[i]).substring(0, 3).equals("ORF")) {
        pairs = ((trim(lines[i])).substring(3)).split("\\.\\.");
        starts[numORFs] = PApplet.parseInt(trim(pairs[0]));
        if (starts[numORFs]<minminrt) {
          //  minminrt = starts[numORFs];
        }
        ends[numORFs] = PApplet.parseInt(trim(pairs[1]));
        if (ends[numORFs]>maxmaxrt) {
          //   maxmaxrt = ends[numORFs];
        }
        numORFs++;
      }//end if
      else if (trim(lines[i]).length()>=6 && trim(lines[i]).substring(0, 6).equals("/label")) {
        // System.err.println(lines[i]);
        // System.err.println(trim(lines[i]).split("=")[1]);
        orfNames[numORFs-1] = trim(lines[i]).split("=")[1];
      }
      else if (i>1 && match(trim(lines[i]), "\\d+ [A-Z]+|[A-Z]+")!=null) {
        haveReference = true;
       // System.err.println(lines[i]);
        String[] temprefs = trim(lines[i]).split(" +");
        int startref = PApplet.parseInt(temprefs[0]);  
        for (int j=1;j<temprefs.length;j++) {
          for (int k=0;k<temprefs[j].length();k++) {
            if (startref+k>=minminrt && startref+k<maxmaxrt) {
              refgen[0][startref+k -minminrt] = temprefs[j].charAt(k);
            }
          }
          startref+=temprefs[j].length();
        }
      }
    }//end for

  }//end else if
  else if (ext.equals("gtf") || ext.equals("gff")) {
    int numORFs = 0;
    String[] tokens;
    for (int i=0;i<lines.length;i++) {

      tokens = splitTokens(lines[i].replaceAll("##.*", ""), "\t");
      if (tokens.length>=8 && (tokens[2].equals("ORF") || tokens[2].equals("gene") || tokens[2].equals("start_codon")))
        numORFs++;
    }
    starts = new int[numORFs];
    ends = new int[numORFs];
    depths = new int[numORFs];
    orfNames = new String[numORFs];
    numORFs = 0;
    for (int i = 0;i<lines.length;i++) {
      tokens = splitTokens(lines[i].replaceAll("##.*", ""), "\t");
      if (tokens.length>=8 && (tokens[2].equals("ORF") || tokens[2].equals("gene"))) {
        starts[numORFs] = PApplet.parseInt(tokens[3]);
        ends[numORFs] = PApplet.parseInt(tokens[4]);
        orfNames[numORFs] = tokens[8].replaceAll("Name.|label.|ORF|;.*", "");
        numORFs++;
      }
      else if (tokens.length>=8 && (tokens[2].equals("start_codon"))) {
        starts[numORFs] = PApplet.parseInt(tokens[3]);
        orfNames[numORFs] = tokens[8].replaceAll("Name.|label.|ORF|;.*", "");
      }
      else if (tokens.length>=8 && (tokens[2].equals("stop_codon"))) {
        ends[numORFs] = PApplet.parseInt(tokens[4]);
        numORFs++;
      }
    }//end for
  }

  for (int i = 0;i<starts.length;i++) {
    if (i==0) {
      depths[i] = 0;
      depthEnds[0] = ends[i];
    }
    else {
      int k = 0;
      while (k<depthEnds.length && depthEnds[k]>starts[i]) {
        k++;
      }
      if (k>=depthEnds.length || depthEnds[k]>starts[i]) {
        int[] depthEndstemp = new int[depthEnds.length+1];
        for (int l=0;l<depthEnds.length;l++) {
          depthEndstemp[l] = depthEnds[l];
        }
        depthEndstemp[depthEndstemp.length-1] = ends[i];
        depths[i] = depthEndstemp.length-1;
        depthEnds = depthEndstemp;
      }
      else {
        depths[i] = k;
        depthEnds[k] = ends[i];
      }
    }
    //System.err.println("ORF["+i+"]: "+starts[i]+"-"+ends[i]+" is at depth "+depths[i]);
  }//end for
  if (haveReference) {
    setSynomRange();
  }
  else {
    calcConsensusGenome();
    setSynomRange();
  }
}




public void setSynomRange() {
  //This method 
  //System.err.println("Coding section of genome goes from "+minminrt+" - "+maxmaxrt);

  int start;
  int end;
  int j;
  boolean missing;
  String curCodon = "";
  int offset = 0;
  for (int i = 0;i<starts.length;i++) {
    start = starts[i]+offset;
    end = ends[i];
    offset = 0;
    for (j = start;j<end;j+=3) {
      curCodon = "";
      for (int k=0;k<3;k++) {
        if (j+k<end && j+k<maxmaxrt && j+k-minminrt>=0) {
          curCodon =curCodon + refgen[0][j+k-minminrt];
        }
      }
      if (curCodon.length()==3) {
        setSynomCodon(curCodon, new int[] {
          j, j+1, j+2
        }
        );
      }
      else if (curCodon.length()==2 && starts[i]+1-minminrt>=0) {
        offset =1;
        curCodon=curCodon+refgen[0][starts[i]+1-minminrt];
        setSynomCodon(curCodon, new int[] {
          j, j+1, starts[i]+1
        }
        );
        // System.err.println("Fixed 1 gap");
      }
      else if (curCodon.length()==1 && starts[i]+2-minminrt>=0 ) {
        offset =2;
        curCodon=curCodon+refgen[0][starts[i]+1-minminrt]+refgen[0][starts[i]+2-minminrt];
        // System.err.println("Fixed 2 gap");
        setSynomCodon(curCodon, new int[] {
          j, starts[i]+1, starts[i]+2
        }
        );
      }
      else {
        // System.err.println("Trouble! '"+curCodon+"'");
      }
    }//end for
  }//end for
}



public void setSynomCodon(String codon, int[] indices) {
  if (codon.length()!=3) {
   // System.err.println("Trouble: "+codon);
  }
  char[] aCodon;
  char[] bCodon; 
  for (int i = 0;i<indices.length;i++) {
    for (int j = 0;j<4;j++) { 
      aCodon = codon.toCharArray();
      aCodon[i] = atcgOrder[j];
      for (int k = 0;k<4;k++) {
        bCodon = codon.toCharArray();
        bCodon[i] = atcgOrder[k];
        synom[indices[i]-minminrt][j][k] = synom[indices[i]-minminrt][j][k] || (!isSynom(new String(aCodon), new String(bCodon)));
      }
    }
  }
}




public int getColor(float tval, double tcer) {
  return getColor(tval, tcer, 1.0f);
}

public double dMap(double val, double vlow, double vhigh, double low, double high) {
  double vnorm = val-vlow;
  vnorm = vnorm/ (vhigh-vlow);
  return (vnorm*(high-low))+low;
}

public int getColor(float tval, double tcer, float maxV) {
  //float val = map(tval,sVar.getValuef(),maxV,wedge.left*maxV,1.0);
  float val = map(tval, 0, maxV, wedge.left*maxV, 1.0f);
  if ( tval < wedge.left*maxV) {
    return bottom;
  }
  else if (val<0.0f) {
    //else if(tval<sVar.getValuef()||val<0.0){
    val = 0.0f;
  }
  else if (val>1.0f) {
    val = 1.0f;
  }

  double lcer = new BigDecimal("1E-"+sConf.getValueI()).doubleValue();
  double cer = 1-tcer;
  if ( lcer == (double)1) {
    System.err.println(sConf.getValueI() + " is too small.");
  }
  if (tcer>lcer) {
    cer = 0.0f;
  }
  cer = dMap(cer, 1-lcer, (double)1, (double)0, (double)1);
  if (cer<0.0f) {
    cer = 0.0f;
  }
  else if (cer>1.0f) {
    cer = 1.0f;
  }

  int cur;
  float valwt = val/(vweight);
  if ( val>=(vweight)) {
    cur = maxcolor;
  }
  else if (tval<0.0f) {
    cur = color(200);
  }
  else if (val<0.0f) {
    cur = left;
  }
  //right 90
  else if ((valwt)>.9f) {
    cur = lerpColor(right90, right, max(min(1, valwt), 0));
  }
  //right 80
  else if ((valwt)>.8f) {
    cur = lerpColor(right80, right90, max(min(1, valwt), 0));
  }
  //right 70
  else if ((valwt)>.7f) {
    cur = lerpColor(right70, right80, max(min(1, valwt), 0));
  }
  //right 60
  else if ((valwt)>.6f) {
    cur = lerpColor(right60, right70, max(min(1, valwt), 0));
  }
  //mid
  else if ((valwt)>.5f) {
    cur = lerpColor(mid, right60, max(min(1, valwt), 0));
  }
  //left 40
  else if ((valwt)>.4f) {
    cur = lerpColor(left40, mid, max(min(1, valwt), 0));
  }
  //left 30
  else if ((valwt)>.3f) {
    cur = lerpColor(left30, left40, max(min(1, valwt), 0));
  }
  //left 20
  else if ((valwt)>.2f) {
    cur = lerpColor(left20, left30, max(min(1, valwt), 0));
  }
  //left 10
  else if ((valwt)>.2f) {
    cur = lerpColor(left10, left20, max(min(1, valwt), 0));
  }
  //extreme left
  else {
    cur = lerpColor(left, left10, max(min(1, valwt), 0));
    // cur = lerpColor(left,mid,.5);
  }

  if (cer<=wedge.bottom) {
    cur = bottom;
  }
  else if (cer<wedge.top) {
    cur = lerpColor(bottom, cur, (float)cer);
  }
  return cur;
}//end getColor

//------------------------------------------------------------------
////////////////////        SAMPLING            ////////////////////
//------------------------------------------------------------------
public void sample(int samples) {
  int maxoffset = maxmaxrt-maxrt;
  int minoffset = minrt-minminrt;
  //System.err.println("r: "+rows+" c:"+ceil(float(cols-maxoffset)/samples)+ " = ("+cols+"-"+maxoffset+")/"+samples);

  vdisp = new float[ceil(PApplet.parseFloat(rows))][ceil(PApplet.parseFloat(vraw[0].length-maxoffset-minoffset)/samples)];
  pdisp = new double[ceil(PApplet.parseFloat(rows))][ceil(PApplet.parseFloat(vraw[0].length-maxoffset-minoffset)/samples)];
  covdisp = new int[ceil(PApplet.parseFloat(rows))][ceil(PApplet.parseFloat(vraw[0].length-maxoffset-minoffset)/samples)];
  vhist = new float[ceil(PApplet.parseFloat(vraw[0].length-maxoffset-minoffset)/samples)];

  float vsum;
  float curV;
  double psum;
  int covsum;
  float n = 0;
  maxcount = 0;
  maxn = 0;
  maxdip = 0;
  maxvariant =0;
  maxcovdisp = 0;
  for (int i=0;i<vdisp.length;i++) {
    for (int j=0;j<vdisp[i].length;j++) {
      vsum = 0;
      psum = 0;
      n = 0;
      covsum = 0;
      for (int k=0;k<samples;k++) {
        if ( (j*samples)+k + minoffset < vraw[i].length - maxoffset) {
          curV= getV(i, (j*samples) + k + minoffset);
          if (!Float.isNaN(curV) && curV!=-1) {
            vsum+=curV;
            covsum+=covraw[i][ (j*samples) + k];
            n++;
            if (curV>0) {
              psum+=getP(i, j);
            }//end if
          }
        }//end if
      }//end for

      covdisp[i][j] = covsum;
      if (covdisp[i][j]>maxcovdisp) {
        maxcovdisp = covdisp[i][j];
        // System.err.println("disp: " + maxcovdisp);
      }
      vdisp[i][j] = vsum/n;
      vhist[j]+=vdisp[i][j];
      pdisp[i][j] = psum/n;
      
      if(vsum==0 && covsum==0){
        vdisp[i][j]=-1;
      }
      
      if (vdisp[i][j]>maxvariant) {
        maxvariant = vdisp[i][j];
      }//end if
    }//end for
  }//end for
  // System.err.println("ct,n,dip: "+maxcount+","+maxn+","+maxdip);
  rows = vdisp.length;
  cols = vdisp[0].length;
}//end sample

//------------------------------------------------------------------
////////////////////      ZOOM                   ////////////////////
//------------------------------------------------------------------

//returns how much to skip in pixels
public void drawBin() {
  int binID = zoomBin;
  float curx = zoomS;
  float cury = 0;
  float h = (bh/ratio);
  float invn = 0;
  float invdip = 0;
  float amt = 0;
  int done = 0;

  pushMatrix();
  translate(xtrans+dataX, ytrans);
  int i;
  int minoffset = minrt-minminrt;
  int maxoffset = maxmaxrt-maxrt;
  int vmask = 0;
  float vVal;
  double cer;
  for (int l = 0;l<rows;l++) {
    i = reorder[l];
    done++;
    curx = zoomS;
    for (int j = binID*binBasePairs + minoffset;j< (binID+1)*binBasePairs +minoffset && j<vraw[i].length-maxoffset;j++) {
   
        //fill(255);
        // rect(curx,i*(bh+rgap)+dataY,bpw,bh);

      vVal = getV(i,j);

      cer = getP(i,j);

      if(sum(vraw[i][j])>0 || covraw[i][j]!=0){
          fill(getColor(vVal, cer, 1.0f));
          rect(curx, cury+dataY, bpw, ratio*h);
      }

      if (bpToIndex(refgen[i+1][j])>=0 && bpToIndex(refgen[i+1][j])!=bpToIndex(refgen[refRow+1][j])) {
         fill(actgcolor[bpToIndex(refgen[i+1][j])]);
      }
      else {
         fill(actgcolor[4]);
      }
        //System.err.println(covraw[i][j]+"/"+maxcovraw);
        //   fill(lerpColor(bottom,color(117,112,179),((float)covraw[i][j])/((float)maxcovraw)));

        //rect(curx,cury-rgap+dataY,bpw,rgap);
      rect(curx, cury+bh+dataY, bpw, rgap);
      fill(0);
      if (refgen[i+1][j]!=refgen[refRow+1][j]) {
         text(refgen[i+1][j]+"", curx, cury+bh+dataY+10);
      }
      else {
         text("\u2022", curx, cury+bh+dataY+10);
      }
        //text(genome[j]+"",curx+(bpw/2.0),cury-rgap+dataY+7);
      if (i==0) {
        if (bpToIndex(refgen[refRow+1][j])>=0) {
          fill(actgcolor[bpToIndex(refgen[refRow+1][j])]);
          rect(curx, dataY-rgap, bpw, rgap);
          fill(0);
          text(refgen[refRow+1][j]+"", curx, dataY-rgap+10);
        }
        else {
          fill(actgcolor[4]);
          rect(curx, dataY-rgap, bpw, rgap);
          fill(0);
          text(refgen[refRow+1][j]+"", curx, dataY-rgap+10);
        }
      }//end if
      curx+=bpw+cgap;
    }//end for
    cury+=bh+rgap;
  }//end for
  popMatrix();
}

public void drawSideGraph() {
  float startx = winWidth-sideGraphWidth+5;
  fill(220);
  stroke(0);
  rect(startx, dataY, sideGraphWidth-10, visibleCount*(bh+rgap)-rgap);
  float curx;
  float cury = dataY;
  float dx = 0;
  int offset = 0;
  int minoffset = minrt-minminrt;
  int maxoffset = maxmaxrt-maxrt;
  noStroke();

  if (rawcol>=minoffset && rawcol<vraw[0].length-maxoffset) {
    int i;
    for (int l = 0;l<rows;l++) {
      i = reorder[l];
    }

    for (int l = 0;l<rows;l++) {
      i = reorder[l];
      curx = startx+1;
      float scaleFactor = 0;
      if (coverageCheck.isSelected()) {
        scaleFactor = map(covraw[i][rawcol], 0, maxcovraw, 0, sideGraphWidth-11);
      }
      else {
        scaleFactor = sideGraphWidth-11;
      }

      if(covraw[i][rawcol]>0){
        for (int j = 0;j<vraw[i][rawcol].length;j++) {
          if (refgen[i+1][rawcol]!=atcgOrder[j]) {
            dx = vraw[i][rawcol][j]*scaleFactor;
          }
          else {
            dx = (1-sum(vraw[i][rawcol])+vraw[i][rawcol][j])*scaleFactor;
          }
  
          fill(actgcolor[j]);
          rect(curx, floor(cury), dx, ceil(bh));
          if (dx>0) {
            fill(0);
            text(atcgOrder[j]+"", floor((dx/2.0f)+curx+textWidth(atcgOrder[j]+"")/2.0f), floor(cury));
          }
          curx+=dx;
          if (curx>startx+sideGraphWidth-11) {
            //System.err.println("Problem " + dx);
          }
        }
      }
      else{
        dx = 1.0f*scaleFactor;
        int bp_i = bpToIndex(refgen[i+1][rawcol]);
        if(bp_i>-1){
          fill(actgcolor[bp_i]);
          rect(curx, floor(cury), dx, ceil(bh));
          if (dx>0) {
              fill(0);
              text(atcgOrder[bp_i]+"", floor((dx/2.0f)+curx+textWidth(atcgOrder[bp_i]+"")/2.0f), floor(cury));
          }
        }
      }
      cury+=rgap+bh;
    }
  }
  else if (col>=0 && col<cols) {
    int i;



    for (int l = 0;l<rows;l++) {
      i = reorder[l];
      
      if(covdisp[i][col]!=0 && vdisp[i][col]!=0){
        float scaleFactor = 0;
        if (coverageCheck.isSelected()) {
          scaleFactor = map(covdisp[i][col], 0, maxcovdisp, 0, (sideGraphWidth-11));
        }
        else {
          scaleFactor = sideGraphWidth-11;
        }
  
        curx = startx+1;
  
        dx = vdisp[i][col]*scaleFactor;
  
        fill(left);
        //rect(curx,cury,sideGraphWidth-dx,bh);
        rect(floor(curx+dx), floor(cury), floor((1-vdisp[i][col])*scaleFactor), floor(bh));
        if (dx>0) {
          fill(right);
          rect(floor(curx), floor(cury), floor(vdisp[i][col]*scaleFactor), floor(bh));
          text("var", curx+(dx/2.0f), cury);
        }
      }
      cury+=rgap+bh;
    }
  }
  if (col>=0 || rawcol>=0) {
    fill(0);
    text("0", startx+textWidth("0")/2.0f, (rows)*(bh+rgap)+dataY);
    if (coverageCheck.isSelected()==false) {
      text("100%", width-(textWidth("100%")/2.0f)-5, (rows)*(bh+rgap)+dataY);
    }
    else if (rawcol>=0) {
      text(maxcovraw+"", width-(textWidth(maxcovraw+"")/2.0f)-5, (rows)*(bh+rgap)+dataY);
    }
    else {
      text(maxcovdisp+"", width-(textWidth(maxcovdisp+"")/2.0f)-5, (rows)*(bh+rgap)+dataY);
    }
    //text(int(maxbps)+"",winWidth-textWidth(int(maxbps)+"")/2.0,(visibleCount)*(bh+rgap)+dataY);
  }
}


public void makeConsensus() {
  refgen[0] = new char[cols];
  int[] samples;
  for (int i = 0;i<refgen[0].length;i++) {
    samples = new int[4];
    for (int j = 0;j<rows;j++) {
      for (int k=0;k<vraw[j][i].length;k++) {
        samples[k]+= covraw[j][i]*vraw[j][i][k];
      }
    }
  }
}


public boolean isSynom(String codonA, String codonB)
{
  if (!codonlookup.containsKey(codonA)||(!codonlookup.containsKey(codonB))) {
    //System.err.println("Trouble: "+codonA+" "+codonB);
    return true;
  }
  return codonlookup.get(codonA).equals(codonlookup.get(codonB));
}

public void setupcodontable()
{	
  codonlookup = new HashMap();
  //T-----------------------
  codonlookup.put("TTT", "F");
  codonlookup.put("TTC", "F");
  codonlookup.put("TTA", "L");
  codonlookup.put("TTG", "L");

  codonlookup.put("TCT", "S");
  codonlookup.put("TCC", "S");
  codonlookup.put("TCA", "S");
  codonlookup.put("TCG", "S");

  codonlookup.put("TAT", "Y");
  codonlookup.put("TAC", "Y");
  codonlookup.put("TAA", "*");
  codonlookup.put("TAG", "*");

  codonlookup.put("TGT", "C");
  codonlookup.put("TGC", "C");
  codonlookup.put("TGA", "*");
  codonlookup.put("TGG", "W");

  //C-----------------------

  codonlookup.put("CTT", "L");
  codonlookup.put("CTC", "L");
  codonlookup.put("CTA", "L");
  codonlookup.put("CTG", "L");

  codonlookup.put("CCT", "P");
  codonlookup.put("CCC", "P");
  codonlookup.put("CCA", "P");
  codonlookup.put("CCG", "P");

  codonlookup.put("CAT", "H");
  codonlookup.put("CAC", "H");
  codonlookup.put("CAA", "Q");
  codonlookup.put("CAG", "Q");

  codonlookup.put("CGT", "R");
  codonlookup.put("CGC", "R");
  codonlookup.put("CGA", "R");
  codonlookup.put("CGG", "R");

  //A------------------------

  codonlookup.put("ATT", "I");
  codonlookup.put("ATC", "I");
  codonlookup.put("ATA", "I");
  codonlookup.put("ATG", "M");

  codonlookup.put("ACT", "T");
  codonlookup.put("ACC", "T");
  codonlookup.put("ACA", "T");
  codonlookup.put("ACG", "T");

  codonlookup.put("AAT", "N");
  codonlookup.put("AAC", "N");
  codonlookup.put("AAA", "K");
  codonlookup.put("AAG", "K");

  codonlookup.put("AGT", "S");
  codonlookup.put("AGC", "S");
  codonlookup.put("AGA", "R");
  codonlookup.put("AGG", "R");


  //G
  codonlookup.put("GTT", "V");
  codonlookup.put("GTC", "V");
  codonlookup.put("GTA", "V");
  codonlookup.put("GTG", "V");

  codonlookup.put("GCT", "A");
  codonlookup.put("GCC", "A");
  codonlookup.put("GCA", "A");
  codonlookup.put("GCG", "A");

  codonlookup.put("GAT", "D");
  codonlookup.put("GAC", "D");
  codonlookup.put("GAA", "E");
  codonlookup.put("GAG", "E");

  codonlookup.put("GGT", "G");
  codonlookup.put("GGC", "G");
  codonlookup.put("GGA", "G");
  codonlookup.put("GGG", "G");
}

public void switchrows(int row1, int row2) {
  int temp = reorder[row1];
  reorder[row1] = reorder[row2];
  reorder[row2] = temp;
  //System.err.println("switched "+row1+","+row2+" to generate "+reorder[row1]+","+reorder[row2]);
  //need to switch:
  //reference[] list
  //draw list
  //metadata
  //rowcolors
}

public float sum(float[] f) {
  float suma = 0;
  for (int i = 0;i<f.length;i++) {
    suma+=f[i];
  }
  return suma;
}

public int sum(int[] f) {
  int suma = 0;
  for (int i = 0;i<f.length;i++) {
    suma+=f[i];
  }
  return suma;
}

public double sum(double[] f) {
  double suma = 0;
  for (int i = 0;i<f.length;i++) {
    suma+=f[i];
  }
  return suma;
}



class Wedge {
public void setup()
{
  size(600,600);
  stroke(0);
}

float wedgeAngle  = PI * .2f;
float wedgeSize = 400;
private int wedgeX = 300;
private int wedgeY = 550;

float right = .7f;
float left = .3f;
float top = .7f;
float bottom = .3f;

int mygray=200;

//these are for the single control mouse point right now
int mx = wedgeX;
int my = wedgeY;
int mouseState = 0;

public Wedge(){
  }
  
public Wedge(int xpos,int ypos, int wsize){
    this.wedgeX = xpos; 
    this.mx = wedgeX;
    this.wedgeY = ypos; 
    this.my = wedgeY;
    this.wedgeSize = wsize;
  }  

public void setWedgeX(int xpos){
    this.wedgeX = xpos; 
    this.mx = wedgeX;
  }
  
public void setWedgeY(int ypos){
    this.wedgeY = ypos; 
    this.my = wedgeY;
  }

public float lerpAngle(float pct)
{
  return (-PI/2- (1-2*pct) * wedgeAngle);
}

public void myarc(float p1,float p2,float r)
{
  arc(wedgeX,wedgeY,wedgeSize*r,wedgeSize*r,lerpAngle(p1),lerpAngle(p2));
}

//these control the 2 yellow button positions
public float posX(float th, float r)
{
  return wedgeX + r*wedgeSize*cos(lerpAngle(th))/2;
}
public float posY(float th, float r)
{
  return wedgeY + r*wedgeSize*sin(lerpAngle(th))/2;
}

public void draw()
{
  pushStyle();
  pushMatrix();
  noStroke();
  colorMode(HSB,1.0f,1.0f,1.0f);
  
  ellipseMode(CENTER);
    fill(1, 1, .76f);
  myarc(right,1,1);
  fill(1, .84f, .76f);
  myarc(right,1,top);
  fill(1, 0.67f, .76f);
  myarc(right,1,top*4/5+bottom/5);
  fill(1, 0.50f, .77f);
  myarc(right,1,top*3/5+bottom*2/5);
  fill(1, 0.34f, .77f);
  myarc(right,1,top*2/5+bottom*3/5);
  fill(1, 0.17f, .78f);
  myarc(right,1,top/5  +bottom*4/5);
  
  //right 90 
  fill(.97f,.95f,.6f);
  myarc(left/10 + right*9/10,right,1);
  fill(.97f,.79f,.63f);
  myarc(left/10 + right*9/10,right,top);
  fill(.97f,.64f,.66f);//.2,.6,.7);
  myarc(left/10 + right*9/10,right,top*4/5+bottom/5);
  fill(.97f,.48f,.70f);//.2,.6,.7);
  myarc(left/10 + right*9/10,right,top*3/5+bottom*2/5);
  fill(.97f,.32f,.74f);//.2,.6,.7);
  myarc(left/10 + right*9/10,right,top*2/5+bottom*3/5);
  fill(.97f,.16f,.78f);//.2,.6,.7);
  myarc(left/10 + right*9/10,right,top/5+bottom*4/5);
  
  //right 80 
  fill(.99f,.90f,.7f);
  myarc(left*2/10 + right*8/10,left/10 + right*9/10,1);
  fill(.99f,.75f,.71f);
  myarc(left*2/10 + right*8/10,left/10 + right*9/10,top);
  fill(.99f,.60f,.73f);//.2,.6,.7);
  myarc(left*2/10 + right*8/10,left/10 + right*9/10,top*4/5+bottom/5);
  fill(.99f,.45f,.74f);//.2,.6,.7);
  myarc(left*2/10 + right*8/10,left/10 + right*9/10,top*3/5+bottom*2/5);
  fill(.99f,.30f,.76f);//.2,.6,.7);
  myarc(left*2/10 + right*8/10,left/10 + right*9/10,top*2/5+bottom*3/5);
  fill(.99f,.15f,.78f);//.2,.6,.7);
  myarc(left*2/10 + right*8/10,left/10 + right*9/10,top/5+bottom*4/5);
  
  //right 70
  fill(.02f,.86f,0.79f);
  myarc(left*3/10 + right*7/10,        left*2/10 + right*8/10,  1);
  fill(.02f,.72f,0.73f);
  myarc(left*3/10 + right*7/10,        left*2/10 + right*8/10,  top);
  fill(.02f,.58f,0.74f);//.2,.6,.7);
  myarc(left*3/10 + right*7/10,        left*2/10 + right*8/10,  top*4/5+bottom/5);
  fill(.02f,.44f,0.75f);//.2,.6,.7);
  myarc(left*3/10 + right*7/10,        left*2/10 + right*8/10,  top*3/5+bottom*2/5);
  fill(.02f,.29f,0.76f);//.2,.6,.7);
  myarc(left*3/10 + right*7/10,        left*2/10 + right*8/10,  top*2/5+bottom*3/5);
  fill(.02f,.14f,0.78f);//.2,.6,.7);
  myarc(left*3/10 + right*7/10,        left*2/10 + right*8/10,  top/5+bottom*4/5);
  
  //right 60
  fill(.05f,.81f,0.89f);
  myarc(left*4/10 + right*6/10,        left*3/10 + right*7/10,  1);
  fill(.05f,.67f,0.86f);
  myarc(left*4/10 + right*6/10,        left*3/10 + right*7/10,  top);
  fill(.05f,.54f,0.84f);//.2,.6,.7);
  myarc(left*4/10 + right*6/10,        left*3/10 + right*7/10,  top*4/5+bottom/5);
  fill(.05f,.40f,0.82f);//.2,.6,.7);
  myarc(left*4/10 + right*6/10,        left*3/10 + right*7/10,  top*3/5+bottom*2/5);
  fill(.05f,.27f,0.80f);//.2,.6,.7);
  myarc(left*4/10 + right*6/10,        left*3/10 + right*7/10,  top*2/5+bottom*3/5);
  fill(.05f,.13f,0.78f);//.2,.6,.7);
  myarc(left*4/10 + right*6/10,        left*3/10 + right*7/10,  top/5+bottom*4/5);
  
  //mid
  fill(.069f, .76f,0.89f);
  myarc(left*5/10 + right*5/10,        left*4/10 + right*6/10,  1);
  fill(.069f , .63f,0.86f);
  myarc(left*5/10 + right*5/10,        left*4/10 + right*6/10,  top);
  fill(.069f , .50f,0.84f);//.2,.6,.7);
  myarc(left*5/10 + right*5/10,        left*4/10 + right*6/10,  top*4/5+bottom/5);
  fill(.069f , .37f,0.82f);//.2,.6,.7);
  myarc(left*5/10 + right*5/10,        left*4/10 + right*6/10,  top*3/5+bottom*2/5);
  fill(.069f , .25f,0.80f);//.2,.6,.7);
  myarc(left*5/10 + right*5/10,        left*4/10 + right*6/10,  top*2/5+bottom*3/5);
  fill(.069f , .12f,0.78f);//.2,.6,.7);
  myarc(left*5/10 + right*5/10,        left*4/10 + right*6/10,  top/5+bottom*4/5);
  
  //left 40 
  fill(.09f,.65f,.99f);
  myarc(left*6/10 + right*4/10,        left*5/10 + right*5/10,  1);
  fill(.09f,.54f,.95f);
  myarc(left*6/10 + right*4/10,        left*5/10 + right*5/10,  top);
  fill(.09f,.43f,.90f);//.2,.6,.7);
  myarc(left*6/10 + right*4/10,        left*5/10 + right*5/10,  top*4/5+bottom/5);
  fill(.09f,.32f,.86f);//.2,.6,.7);
  myarc(left*6/10 + right*4/10,        left*5/10 + right*5/10,  top*3/5+bottom*2/5);
  fill(.09f,.22f,.82f);//.2,.6,.7);
  myarc(left*6/10 + right*4/10,        left*5/10 + right*5/10,  top*2/5+bottom*3/5);
  fill(.09f,.11f,.78f);//.2,.6,.7);
  myarc(left*6/10 + right*4/10,        left*5/10 + right*5/10,  top/5+bottom*4/5);
    
  //left 30 
  fill(.108f,.54f,.99f);
  myarc(left*7/10 + right*3/10,        left*6/10 + right*4/10,  1);
  fill(.108f,.45f,.95f);
  myarc(left*7/10 + right*3/10,        left*6/10 + right*4/10,  top);
  fill(.108f,.36f,.90f);//.2,.6,.7);
  myarc(left*7/10 + right*3/10,        left*6/10 + right*4/10,  top*4/5+bottom/5);
  fill(.108f,.27f,.86f);//.2,.6,.7);
  myarc(left*7/10 + right*3/10,        left*6/10 + right*4/10,  top*3/5+bottom*2/5);
  fill(.108f,.18f,.82f);//.2,.6,.7);
  myarc(left*7/10 + right*3/10,        left*6/10 + right*4/10,  top*2/5+bottom*3/5);
  fill(.108f,.09f,.78f);//.2,.6,.7);
  myarc(left*7/10 + right*3/10,        left*6/10 + right*4/10,  top/5+bottom*4/5);
  
  //left 20  
  fill(.128f,.42f,1);
  myarc(left*8/10 + right*2/10,        left*7/10 + right*3/10,  1);
  fill(.128f,.35f,.96f);
  myarc(left*8/10 + right*2/10,        left*7/10 + right*3/10,  top);
  fill(.128f,.28f,.91f);//.2,.6,.7);
  myarc(left*8/10 + right*2/10,        left*7/10 + right*3/10,  top*4/5+bottom/5);
  fill(.128f,.21f,.87f);//.2,.6,.7);
  myarc(left*8/10 + right*2/10,        left*7/10 + right*3/10,  top*3/5+bottom*2/5);
  fill(.128f,.14f,.82f);//.2,.6,.7);
  myarc(left*8/10 + right*2/10,        left*7/10 + right*3/10,  top*2/5+bottom*3/5);
  fill(.128f,.07f,.78f);//.2,.6,.7);
  myarc(left*8/10 + right*2/10,        left*7/10 + right*3/10,  top/5+bottom*4/5);
  
  //left 10  
  fill(.147f,.31f,1);
  myarc(left*9/10 + right/10,        left*8/10 + right*2/10,  1);
  fill(.147f,.26f,.96f);
  myarc(left*9/10 + right/10,        left*8/10 + right*2/10,  top);
  fill(.147f,.21f,.91f);//.2,.6,.7);
  myarc(left*9/10 + right/10,        left*8/10 + right*2/10,  top*4/5+bottom/5);
  fill(.147f,.16f,.87f);//.2,.6,.7);
  myarc(left*9/10 + right/10,        left*8/10 + right*2/10,  top*3/5+bottom*2/5);
  fill(.147f,.11f,.82f);//.2,.6,.7);
  myarc(left*9/10 + right/10,        left*8/10 + right*2/10,  top*2/5+bottom*3/5);
  fill(.147f,.05f,.78f);//.2,.6,.7);
  myarc(left*9/10 + right/10,        left*8/10 + right*2/10,  top/5+bottom*4/5);  
  
  //left 
  fill(.167f,.2f,1);
  myarc(left,  left*9/10 + right/10,  1);
  fill(.167f,.17f,0.96f);
  myarc(left,  left*9/10 + right/10,  top);
  fill(.167f,.14f,0.91f);//.2,.6,.7);
  myarc(left,  left*9/10 + right/10,  top*4/5+bottom/5);
  fill(.167f,.10f,0.87f);//.2,.6,.7);
  myarc(left,  left*9/10 + right/10,  top*3/5+bottom*2/5);
  fill(.167f,.07f,0.82f);//.2,.6,.7);
  myarc(left,  left*9/10 + right/10,  top*2/5+bottom*3/5);
  fill(.167f,.03f,0.78f);//.2,.6,.7);
  myarc(left,  left*9/10 + right/10,  top/5+bottom*4/5);
  
  fill(0,0,.7f);
  myarc(left,1,bottom);
  
  colorMode(RGB,1.0f,1.0f,1.0f);
  fill(1,1,0);
  int rad1 = 10;
  int rad2 = 10;
  if(mouseState==1){
    rad1 = 15;
  }
  else if(mouseState==2){
    rad2 = 15;
  }
  ellipse(posX(right,top),posY(right,top),rad1,rad1);
  ellipse(posX(left,bottom),posY(left,bottom),rad2,rad2);
  if(mouseState>0){
   // ellipse(mx,my,9,9);
  }
  popMatrix();
  popStyle();
}

public void mousePressedAlt(float mX,float mY)
{
  if ((abs(posX(right,top)-mX) < 20) &&
      (abs(posY(right,top)-mY) < 20)) {
    mouseState = 1;
      }
  if ((abs(posX(left,bottom)-mX) < 20) &&
      (abs(posY(left,bottom)-mY) < 20)) {
    mouseState = 2;
      }
}
public void mouseReleasedAlt()
{
  mouseState = 0;
}

public void mouseDraggedAlt(float nx,float ny)
{
  mx = PApplet.parseInt(nx);
  my = PApplet.parseInt(ny);  

  float fx = PApplet.parseFloat(mx-wedgeX);
  float fy = PApplet.parseFloat(wedgeY-my);
  
  float r = sqrt(fx*fx+fy*fy)/wedgeSize*2;
  float a = atan2(fy,fx);
  
  a = 1-(1+(a-PI/2)/wedgeAngle)/2;
  
  if (a<0) a = 0;
  if (a>1) a = 1;
  if (r<0) r = 0;
  if (r>1) r = 1;
  
  if (mouseState == 1) {
    right = a;
    top = r;
    
    if (left>right) left=right;
    if (bottom>top) bottom=top;
  }
  if (mouseState == 2) {
    left = a;
    bottom = r;
    
    if(right<left) right=left;
    if(top<bottom) top=bottom;
  }
}


}

  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "LayerCake" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}
