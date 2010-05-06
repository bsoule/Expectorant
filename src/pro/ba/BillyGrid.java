package pro.ba;

import java.util.ArrayList;
import java.util.Random;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;

public class BillyGrid extends Activity {
	private int billySize = 20;
	private int nCols;
	private int nRows;
	private static String TAG = "BILLY";
	private Random rr = new Random();
	private TableLayout billyGrid;

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.grid);

		nCols = (int) Math.floor(Math.sqrt(billySize)); //TODO: test for Portrait vs Landscape and switch floor/ceil accordingly
		nRows = (int) Math.ceil((double)billySize/nCols);       

		billyGrid = (TableLayout) findViewById(R.id.billygrid);
		createBillyGrid();
		updateBillyGrid(0);
	}

	// call this to refresh layout (tablelayout) with new probability
	void updateBillyGrid(double p) {
		boolean[] rands = RandomKSubset(billySize, p);
		for (int i=0; i<billyGrid.getChildCount(); i++) {
			TableRow tr = (TableRow) billyGrid.getChildAt(i);
			for (int j=0; j<tr.getChildCount(); j++) {
				TextView tv = (TextView) tr.getChildAt(j);
				tv.requestLayout();
				if ( rands[i*nCols + j] ) {
					tv.setBackgroundColor(Color.DKGRAY);
				} else {
					tv.setBackgroundColor(Color.BLACK);
				}
			}
		}
		billyGrid.requestLayout();
	}


	// make the billyGrid. start with all views false.
	private void createBillyGrid() {
		//TableLayout table = new TableLayout(this);
		//ArrayList<TableRow> bg = new ArrayList<TableRow>();
		TableRow row = null;
		for (int i=0; i<billySize; i++) {
			if (i % nCols == 0) {
				billyGrid.addView(new TableRow(this));
				row = (TableRow) billyGrid.getChildAt(billyGrid.getChildCount()-1);
			}
			row.addView(billyGetView(i));
		}
		billyGrid.setStretchAllColumns(true);
	}

	TextView billyGetView(int n) {
		TextView tv = new TextView(this);
		tv.setText(""+n);
		tv.setGravity(Gravity.CENTER);
		tv.setTextSize(30);
		tv.setPadding(0,5,0,5);

		return tv;
	}

	// return a set of lit/unlit for each digit [0..n-1] 
	// s.t. the probability of any prechosen number [0..n-1]
	// being lit up is p. (eg p=1/2 then light up half at random) 
	boolean[] RandomKSubset(int n, double p) {
		int q = ( rr.nextDouble() < p*billySize - Math.floor(p*billySize) ) ? 1 : 0;
		int nlit = (int) Math.floor(p*billySize) + q; // 'k'

		double needed = nlit*1.0;
		boolean[] result = new boolean[n];
		for (int i=0; i<n; i++) {
			if ( rr.nextDouble() < needed/(n-i) ) {
				result[i] = true;
				needed--;
			} else {
				result[i] = false;
			}
		}
		return result;
	}

}