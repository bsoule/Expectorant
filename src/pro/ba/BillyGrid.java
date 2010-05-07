package pro.ba;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
import android.widget.Toast;

public class BillyGrid extends Activity {
	private int billySize = 20;
	private int nCols;
	private TableLayout billyGrid;
	private Button billyButton;
	private EditText billyProb;
	private int billyUnLit = Color.DKGRAY;
	private boolean[] billySubset;
	
	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.grid);
		
		nCols = (int) Math.floor(Math.sqrt(billySize)); //TODO: test for Portrait vs Landscape and switch floor/ceil accordingly

		billyProb = (EditText) findViewById(R.id.billyprob);
		billyProb.setHint("Enter an expression");
		billyButton = (Button) findViewById(R.id.billybutton);
		billyButton.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				try {
					double p = BillyTilities.arithmeval(billyProb.getText().toString());
					billySubset = BillyTilities.BillySubset(billySize, p);
					updateBillyGrid(billySubset);
					//Toast.makeText()
				} catch (Exception e) {
					Toast.makeText(v.getContext(), "There seems to be an error in your expression.", Toast.LENGTH_SHORT);
				}
			}
		});
		
		billyGrid = (TableLayout) findViewById(R.id.billygrid);
		createBillyGrid();
		billySubset = BillyTilities.BillySubset(billySize, 0);
		updateBillyGrid(billySubset);
	}

	// call this to refresh layout (tablelayout) with new probability
	void updateBillyGrid(boolean[] bsub) {
		for (int i=0; i<billyGrid.getChildCount(); i++) {
			TableRow tr = (TableRow) billyGrid.getChildAt(i);
			for (int j=0; j<tr.getChildCount(); j++) {
				TextView tv = (TextView) tr.getChildAt(j);
				if ( bsub[i*nCols + j] ) {
					tv.setTextColor(Color.WHITE);
				} else {
					tv.setTextColor(billyUnLit);
				}
				tv.requestLayout();
			}
		}
		billyGrid.requestLayout();
	}

	// make the billyGrid. start with all views false.
	private void createBillyGrid() {
		TableRow row = null;
		for (int i=0; i<billySize; i++) {
			if (i % nCols == 0) {
				billyGrid.addView(new TableRow(this));
				row = (TableRow) billyGrid.getChildAt(billyGrid.getChildCount()-1);
			}
			row.addView(billyGetView(i+1));
		}
		billyGrid.setStretchAllColumns(true);
	}

	TextView billyGetView(int n) {
		TextView tv = new TextView(this);
		tv.setText(""+n);
		tv.setGravity(Gravity.CENTER);
		tv.setTextSize(30);
		tv.setPadding(0,5,0,5);
		tv.setTextColor(billyUnLit);

		return tv;
	}

}